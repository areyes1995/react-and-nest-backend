import { Body, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import {
  CreateHolidayDto,
  CreateSchoolYearDto,
  UpdateSchoolYearDto,
} from './dto/school-year.dto';
import { SchoolYearService } from './school-year.service';

@EducraftController('school-years', 'Año escolar', 'academic:manage')
export class SchoolYearController {
  constructor(private readonly years: SchoolYearService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Años escolares del docente con periodos y feriados.' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.years.list(user.id);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Año escolar con su calendario de semanas lectivas.' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.years.get(user.id, id);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Crea el año escolar (queda activo).' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSchoolYearDto) {
    return this.years.create(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSchoolYearDto,
  ) {
    return this.years.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.years.remove(user.id, id);
  }

  @Post(':id/holidays')
  addHoliday(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateHolidayDto,
  ) {
    return this.years.addHoliday(user.id, id, dto);
  }

  @Delete('holidays/:holidayId')
  @HttpCode(204)
  removeHoliday(
    @CurrentUser() user: AuthenticatedUser,
    @Param('holidayId', ParseIntPipe) holidayId: number,
  ) {
    return this.years.removeHoliday(user.id, holidayId);
  }
}
