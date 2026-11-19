import {
  Body,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { EducraftController } from '../shared/educraft-controller.decorator';
import {
  CreateAxisDto,
  CreateCapacityDto,
  CreatePerformanceDto,
  ImportCurriculumDto,
  UpdateAxisDto,
  UpdateCapacityDto,
  UpdatePerformanceDto,
} from './dto/curriculum.dto';
import { CurriculumService } from './curriculum.service';

/** Escrituras del catálogo: requieren el permiso `curriculum:manage`. */
@EducraftController(
  'curriculum',
  'Catálogo curricular (gestión)',
  'curriculum:manage',
)
export class CurriculumManageController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Post('import')
  @ApiResponse({
    status: 201,
    description: 'Catálogo importado (upsert por clave estable).',
  })
  import(@Body() dto: ImportCurriculumDto) {
    return this.curriculum.import(dto);
  }

  @Get('axes/:id')
  axis(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.axis(id);
  }

  @Post('axes')
  createAxis(@Body() dto: CreateAxisDto) {
    return this.curriculum.createAxis(dto);
  }

  @Put('axes/:id')
  updateAxis(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAxisDto,
  ) {
    return this.curriculum.updateAxis(id, dto);
  }

  @Delete('axes/:id')
  @HttpCode(204)
  removeAxis(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.removeAxis(id);
  }

  @Get('capacities/:id')
  capacity(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.capacity(id);
  }

  @Post('capacities')
  createCapacity(@Body() dto: CreateCapacityDto) {
    return this.curriculum.createCapacity(dto);
  }

  @Put('capacities/:id')
  updateCapacity(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCapacityDto,
  ) {
    return this.curriculum.updateCapacity(id, dto);
  }

  @Delete('capacities/:id')
  @HttpCode(204)
  removeCapacity(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.removeCapacity(id);
  }

  @Get('performances/:id')
  performance(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.performance(id);
  }

  @Post('performances')
  createPerformance(@Body() dto: CreatePerformanceDto) {
    return this.curriculum.createPerformance(dto);
  }

  @Put('performances/:id')
  updatePerformance(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePerformanceDto,
  ) {
    return this.curriculum.updatePerformance(id, dto);
  }

  @Delete('performances/:id')
  @HttpCode(204)
  removePerformance(@Param('id', ParseIntPipe) id: number) {
    return this.curriculum.removePerformance(id);
  }
}
