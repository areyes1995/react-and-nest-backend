import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getMyNotifications(
    @CurrentUser() user: { id: number },
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('onlyUnread') onlyUnread?: string,
  ) {
    return this.notificationService.getForUser(user.id, {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      onlyUnread: onlyUnread === 'true',
    });
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: { id: number }) {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: { id: number }) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(user.id, id);
  }
}
