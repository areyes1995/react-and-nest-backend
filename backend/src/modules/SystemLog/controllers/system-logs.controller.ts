import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SystemLogsService } from '../system-logs.service';
import { CreateSystemLogDto } from '../dto/create-system-log.dto';
import { UpdateSystemLogDto } from '../dto/update-system-log.dto';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ROLES } from 'src/modules/auth/constants/roles.constants';

@Controller('system-logs')
@UseGuards(JwtGuard)
export class SystemLogsController {
  constructor(private readonly service: SystemLogsService) {}

  @Post() create(@Body() dto: CreateSystemLogDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(ROLES.ADMIN)
  @UseGuards(RolesGuard)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSystemLogDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
