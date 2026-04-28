import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(userId: string, type: string, title: string, message?: string, data?: any) {
    return this.notificationModel.create({
      userId: new Types.ObjectId(userId),
      type,
      title,
      message,
      data,
    });
  }

  async findAll(userId: string, limit = 20, skip = 0) {
    const uid = new Types.ObjectId(userId);
    const [items, total] = await Promise.all([
      this.notificationModel
        .find({ userId: uid })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean()
        .exec(),
      this.notificationModel.countDocuments({ userId: uid }),
    ]);
    return { items, total, hasMore: skip + limit < total };
  }

  async markRead(userId: string, id: string) {
    return this.notificationModel.updateMany(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { readAt: new Date() },
    );
  }

  async markAllRead(userId: string) {
    return this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), readAt: null },
      { readAt: new Date() },
    );
  }

  async unreadCount(userId: string) {
    const count = await this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      readAt: null,
    });
    return { count };
  }
}
