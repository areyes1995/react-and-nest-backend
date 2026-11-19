import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { ROLES } from 'src/modules/auth/constants/roles.constants';
import { AuthenticatedUser } from 'src/modules/educraft/shared/authenticated-user';
import {
  CreateConversationDto,
  SendMessageDto,
  ShareResourceDto,
} from './dto/messaging.dto';
import { MessagingService } from './messaging.service';

@ApiTags('Mensajería docente')
@ApiBearerAuth()
@Controller('messaging')
@UseGuards(JwtGuard, RolesGuard)
@Roles(ROLES.DOCENTE, ROLES.ADMIN, ROLES.SUPERADMIN)
@Permissions('academic:manage')
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get('conversations')
  conversations(@CurrentUser() user: AuthenticatedUser) {
    return this.messaging.listConversations(user.id);
  }

  @Post('conversations')
  createConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.messaging.createConversation(user.id, dto);
  }

  @Get('shared')
  shared(@CurrentUser() user: AuthenticatedUser) {
    return this.messaging.listShared(user.id);
  }

  @Get('candidates')
  candidates(@CurrentUser() user: AuthenticatedUser) {
    return this.messaging.listCandidates(user.id);
  }

  @Get('conversations/:id/messages')
  messages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.messaging.listMessages(user.id, id);
  }

  @Post('conversations/:id/messages')
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.messaging.sendMessage(user.id, id, dto);
  }

  @Patch('conversations/:id/read')
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.messaging.markRead(user.id, id);
  }

  @Post('conversations/:id/share')
  share(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ShareResourceDto,
  ) {
    return this.messaging.shareResource(user.id, id, dto);
  }
}
