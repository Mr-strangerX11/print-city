import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus, TicketPriority, Role } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(userId: string, dto: { subject: string; category?: string; priority?: TicketPriority; orderId?: string; message: string }) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        category: dto.category ?? 'GENERAL',
        priority: dto.priority ?? TicketPriority.MEDIUM,
        orderId: dto.orderId,
        messages: { create: { senderId: userId, body: dto.message, isStaff: false } },
      },
      include: { messages: true },
    });
  }

  async listTickets(userId: string, role: Role, query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where: any = {};

    if (role === Role.CUSTOMER) where.userId = userId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where, skip, take: limit, orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getTicket(id: string, userId: string, role: Role) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (role === Role.CUSTOMER && ticket.userId !== userId) throw new ForbiddenException();
    return ticket;
  }

  async replyToTicket(id: string, senderId: string, role: Role, body: string, attachments?: string[]) {
    await this.getTicket(id, senderId, role);

    const message = await this.prisma.supportMessage.create({
      data: { ticketId: id, senderId, body, isStaff: role !== Role.CUSTOMER, attachments: attachments ?? [] },
    });

    // Keep ticket open on customer reply, move to in_progress on staff reply
    await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: role !== Role.CUSTOMER ? TicketStatus.IN_PROGRESS : TicketStatus.OPEN,
        updatedAt: new Date(),
      },
    });

    return message;
  }

  async updateTicketStatus(id: string, status: TicketStatus) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.prisma.supportTicket.update({ where: { id }, data: { status } });
  }

  async getStats() {
    const [open, inProgress, resolved, closed] = await this.prisma.$transaction([
      this.prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.RESOLVED } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.CLOSED } }),
    ]);
    return { open, inProgress, resolved, closed, total: open + inProgress + resolved + closed };
  }
}
