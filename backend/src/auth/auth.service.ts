import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcryptjs';
import { Role } from '../user/schemas/user.schema';
import { MailService } from '../mail/mail.service';
import { VendorsService } from '../vendors/vendors.service';
import slugify from 'slugify';

@Injectable()
export class AuthService {
  constructor(
    private users: UserService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
    private vendors: VendorsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    if (dto.role === Role.VENDOR && !dto.storeName) {
      throw new BadRequestException('Store name is required for vendor registration');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await this.users.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
      role: dto.role ?? Role.CUSTOMER,
      isVerified: false,
      verificationOtp: otp,
      verificationOtpExpiry: otpExpiry,
    } as any);

    this.mail.sendVerificationOtp(user.email, user.name, otp).catch(() => {});

    return { requiresVerification: true, email: user.email };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in. Check your inbox for the OTP.');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token required');
    try {
      const payload = this.jwt.verify<{ sub: string }>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.users.findById(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');
      return this.generateTokens(user.id, user.email, user.role);
    } catch (e: any) {
      throw new UnauthorizedException(e?.message ?? 'Invalid or expired refresh token');
    }
  }

  async getMe(userId: string) {
    // Vendor population logic should be refactored to use Mongoose population if needed
    const user = await this.users.findById(userId);
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // If changing password, verify current password first
    if (dto.newPassword) {
      if (!dto.currentPassword) throw new BadRequestException('Current password is required to set a new password');
      if (!user.passwordHash) throw new BadRequestException('Cannot set password for OAuth accounts');
      const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!valid) throw new BadRequestException('Current password is incorrect');
    }

    // If changing email, ensure it is not taken by another user
    if (dto.email && dto.email !== user.email) {
      const taken = await this.users.findByEmail(dto.email);
      if (taken) throw new ConflictException('Email already in use');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.avatar !== undefined) data.avatar = dto.avatar;
    if (dto.newPassword) data.passwordHash = await bcrypt.hash(dto.newPassword, 12);

    return this.users.update(userId, data);
  }

  async listUsers(query: { page?: number; role?: string; search?: string }) {
    // Pagination and filtering logic should be refactored for Mongoose
    const users = await this.users.findAll();
    return { items: users, total: users.length, page: 1, totalPages: 1 };
  }

  async toggleUserStatus(userId: string, isActive: boolean) {
    const user = await this.users.findById(userId);
    if (!user) throw new Error('User not found');
    return this.users.update(userId, { isActive });
  }

  async handleGoogleLogin(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    let user = await this.users.findByEmail(googleUser.email);
    if (!user) {
      user = await this.users.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        avatar: googleUser.avatar,
        role: Role.CUSTOMER,
      });
    } else if (!user.googleId) {
      user = await this.users.update(user.id, { googleId: googleUser.googleId });
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified) throw new BadRequestException('Account already verified');
    if (!user.verificationOtp || user.verificationOtp !== otp) throw new BadRequestException('Invalid OTP');
    if (user.verificationOtpExpiry && user.verificationOtpExpiry < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }
    await this.users.update(user.id, {
      isVerified: true,
      verificationOtp: undefined,
      verificationOtpExpiry: undefined,
    } as any);
    return this.generateTokens(user.id, user.email, user.role);
  }

  async resendOtp(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified) throw new BadRequestException('Account already verified');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await this.users.update(user.id, { verificationOtp: otp, verificationOtpExpiry: otpExpiry } as any);
    this.mail.sendVerificationOtp(user.email, user.name, otp).catch(() => {});
    return { message: 'OTP resent successfully' };
  }

  async createVendorByAdmin(dto: { name: string; email: string; password: string; storeName: string }) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: Role.VENDOR,
      isVerified: true,
    } as any);
    await this.vendors.createVendor(user.id, dto.storeName);
    return { message: 'Vendor created successfully', userId: user.id };
  }

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
    } as any);
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES', '7d'),
    } as any);
    return { accessToken, refreshToken, role };
  }
}
