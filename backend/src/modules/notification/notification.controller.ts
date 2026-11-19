import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/notification.dto';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ROLES } from 'src/modules/auth/constants/roles.constants';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtGuard, RolesGuard)
@Permissions('notification:read')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @Roles(ROLES.ADMIN, ROLES.SUPERADMIN)
  @Permissions('notification:update')
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.createNotification(dto);
  }

  @Delete(':id')
  @Permissions('notification:update')
  remove(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.remove(user.id, id);
  }

  @Patch(':id/unread')
  @Permissions('notification:update')
  markUnread(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsUnread(user.id, id);
  }

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
  @Permissions('notification:update')
  markAllAsRead(@CurrentUser() user: { id: number }) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  @Permissions('notification:update')
  markAsRead(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(user.id, id);
  }
}
