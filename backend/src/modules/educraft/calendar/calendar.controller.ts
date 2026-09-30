import { Body, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import { addDays, formatDateOnly } from '../shared/dates.util';
import { CalendarService } from './calendar.service';
import { CreateEventDto, UpdateEventDto } from './dto/calendar.dto';

@EducraftController('calendar', 'Calendario académico', 'planning:manage')
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get()
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'classes', required: false, description: 'false para omitir clases del horario' })
  @ApiResponse({ status: 200, description: 'Agenda: eventos, clases y feriados.' })
  agenda(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('classes') classes?: string,
  ) {
    const today = new Date();
    return this.calendar.agenda(
      user.id,
      from ?? formatDateOnly(today),
      to ?? formatDateOnly(addDays(today, 30)),
      classes !== 'false',
    );
  }

  @Get('events/:id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.calendar.get(user.id, id);
  }

  @Post('events')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEventDto) {
    return this.calendar.create(user.id, dto);
  }

  @Put('events/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
  ) {
    return this.calendar.update(user.id, id, dto);
  }

  @Delete('events/:id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.calendar.remove(user.id, id);
  }
}
