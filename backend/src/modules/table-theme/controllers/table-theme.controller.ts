// ──────────────────────────────────────────────
// Estilo de la mesa de práctica.
//   GET /table/theme  → el estilo por defecto (cualquier usuario)
//   PUT /table/theme  → cambiarlo (ADMIN / SUPERADMIN)
// ──────────────────────────────────────────────

import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ROLES } from 'src/modules/auth/constants/roles.constants';
import { TableThemeService } from '../services/table-theme.service';
import { UpdateTableThemeDto } from '../dtos/table-theme.dto';

@ApiTags('table-theme')
@Controller('table/theme')
@UseGuards(JwtGuard)
export class TableThemeController {
  constructor(private readonly themes: TableThemeService) {}

  @Get()
  @ApiOperation({ summary: 'Estilo de mesa que ven todos los usuarios.' })
  find() {
    return this.themes.find();
  }

  @Put()
  @Roles(ROLES.SUPERADMIN, ROLES.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Cambia el estilo de mesa por defecto.' })
  update(
    @Body() dto: UpdateTableThemeDto,
    @Req() request: { user?: { id?: number; sub?: number } },
  ) {
    const userId = Number(request?.user?.id ?? request?.user?.sub);
    return this.themes.update(
      dto.themeId,
      Number.isFinite(userId) ? userId : undefined,
    );
  }
}
