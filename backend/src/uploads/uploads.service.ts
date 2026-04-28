import { Injectable, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class UploadsService {
  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  private isCloudinaryConfigured(): boolean {
    const name = this.config.get<string>('CLOUDINARY_CLOUD_NAME') ?? '';
    return name.length > 0 && name !== 'your_cloud_name';
  }

  private async uploadFileLocally(file: Express.Multer.File, folder: string): Promise<UploadApiResponse> {
    const uploadsDir = join(process.cwd(), 'uploads', folder);
    await mkdir(uploadsDir, { recursive: true });
    const ext = extname(file.originalname) || '.bin';
    const filename = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
    await writeFile(join(uploadsDir, filename), file.buffer);
    const port = this.config.get<string>('API_PORT') ?? '4000';
    const url = `http://localhost:${port}/uploads/${folder}/${filename}`;
    return {
      secure_url: url,
      public_id: `${folder}/${filename}`,
      url,
      original_filename: file.originalname,
      format: ext.replace('.', ''),
      resource_type: 'image',
      bytes: file.size,
    } as unknown as UploadApiResponse;
  }

  async uploadFile(file: Express.Multer.File, folder = 'ap'): Promise<UploadApiResponse> {
    if (!this.isCloudinaryConfigured()) {
      return this.uploadFileLocally(file, folder);
    }
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error) {
            return reject(new BadGatewayException(`Upload failed: ${error.message}`));
          }
          resolve(result!);
        },
      );
      Readable.from(file.buffer).pipe(upload);
    });
  }

  async deleteFile(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }

  generateSignature(folder = 'ap') {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = `folder=${folder}&timestamp=${timestamp}`;
    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      this.config.get('CLOUDINARY_API_SECRET')!,
    );
    return {
      signature,
      timestamp,
      cloudName: this.config.get('CLOUDINARY_CLOUD_NAME'),
      apiKey: this.config.get('CLOUDINARY_API_KEY'),
      folder,
    };
  }
}
