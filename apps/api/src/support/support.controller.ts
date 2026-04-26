import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { SupportService } from './support.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TicketStatus, TicketPriority, Role } from '@prisma/client';

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('tickets')
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.support.createTicket(user.id, body);
  }

  @Get('tickets')
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.support.listTickets(user.id, user.role, query);
  }

  @Get('tickets/stats') @Roles(Role.ADMIN)
  stats() { return this.support.getStats(); }

  @Get('tickets/:id')
  getOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.support.getTicket(id, user.id, user.role);
  }

  @Post('tickets/:id/reply')
  reply(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.support.replyToTicket(id, user.id, user.role, body.message, body.attachments);
  }

  @Patch('tickets/:id/status') @Roles(Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: TicketStatus) {
    return this.support.updateTicketStatus(id, status);
  }
}
