import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.svc.findAll(userId, limit ? Number(limit) : 20, skip ? Number(skip) : 0);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser('id') userId: string) { return this.svc.unreadCount(userId); }

  @Patch('read-all')
  markAllRead(@CurrentUser('id') userId: string) { return this.svc.markAllRead(userId); }

  @Patch(':id/read')
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.svc.markRead(userId, id); }
}
