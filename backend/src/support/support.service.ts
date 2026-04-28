import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TicketStatus, TicketPriority } from '../common/enums';
import { Role } from '../user/schemas/user.schema';
import { SupportTicket, SupportTicketDocument } from './schemas/support-ticket.schema';
import { SupportMessage, SupportMessageDocument } from './schemas/support-message.schema';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportTicket.name) private ticketModel: Model<SupportTicketDocument>,
    @InjectModel(SupportMessage.name) private messageModel: Model<SupportMessageDocument>,
  ) {}

  async createTicket(userId: string, dto: { subject: string; category?: string; priority?: TicketPriority; orderId?: string; message: string }) {
    const uid = new Types.ObjectId(userId);

    const ticket = await this.ticketModel.create({
      userId: uid,
      subject: dto.subject,
      category: dto.category ?? 'GENERAL',
      priority: dto.priority ?? TicketPriority.MEDIUM,
      orderId: dto.orderId ? new Types.ObjectId(dto.orderId) : undefined,
    });

    const message = await this.messageModel.create({
      ticketId: ticket._id,
      senderId: uid,
      body: dto.message,
      isStaff: false,
    });

    return { ...ticket.toObject(), messages: [message] };
  }

  async listTickets(userId: string, role: Role, query: any): Promise<any> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (role === Role.CUSTOMER) filter.userId = new Types.ObjectId(userId);
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;

    const [tickets, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean()
        .exec(),
      this.ticketModel.countDocuments(filter),
    ]);

    const items = await Promise.all(
      tickets.map(async (ticket) => {
        const messageCount = await this.messageModel.countDocuments({ ticketId: ticket._id });
        return { ...ticket, _count: { messages: messageCount } };
      }),
    );

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getTicket(id: string, userId: string, role: Role): Promise<any> {
    const ticket = await this.ticketModel
      .findById(id)
      .populate('userId', 'name email')
      .lean()
      .exec();
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (role === Role.CUSTOMER && ticket.userId.toString() !== userId) throw new ForbiddenException();

    const messages = await this.messageModel
      .find({ ticketId: new Types.ObjectId(id) })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    return { ...ticket, messages };
  }

  async replyToTicket(id: string, senderId: string, role: Role, body: string, attachments?: string[]) {
    await this.getTicket(id, senderId, role);

    const message = await this.messageModel.create({
      ticketId: new Types.ObjectId(id),
      senderId: new Types.ObjectId(senderId),
      body,
      isStaff: role !== Role.CUSTOMER,
      attachments: attachments ?? [],
    });

    await this.ticketModel.findByIdAndUpdate(id, {
      status: role !== Role.CUSTOMER ? TicketStatus.IN_PROGRESS : TicketStatus.OPEN,
      updatedAt: new Date(),
    });

    return message;
  }

  async updateTicketStatus(id: string, status: TicketStatus) {
    const ticket = await this.ticketModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async getStats() {
    const [open, inProgress, resolved, closed] = await Promise.all([
      this.ticketModel.countDocuments({ status: TicketStatus.OPEN }),
      this.ticketModel.countDocuments({ status: TicketStatus.IN_PROGRESS }),
      this.ticketModel.countDocuments({ status: TicketStatus.RESOLVED }),
      this.ticketModel.countDocuments({ status: TicketStatus.CLOSED }),
    ]);
    return { open, inProgress, resolved, closed, total: open + inProgress + resolved + closed };
  }
}
