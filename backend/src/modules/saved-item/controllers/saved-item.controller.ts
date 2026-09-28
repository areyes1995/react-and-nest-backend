// ──────────────────────────────────────────────
// Endpoints de la biblioteca personal del estudiante.
//   GET    /saved-items                       → todo lo guardado
//   POST   /saved-items/:kind/:contentId/toggle → el botón de la ficha
//   PUT    /saved-items/:kind/:contentId      → guardar (idempotente)
//   DELETE /saved-items/:kind/:contentId      → quitar
//
// Siempre en el ámbito del usuario del token: no hay
// forma de leer ni tocar los guardados de otro.
// ──────────────────────────────────────────────

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { SavedItemService } from '../services/saved-item.service';
import {
  SAVED_ITEM_KINDS,
  SaveItemDto,
  SavedItemKindId,
} from '../dtos/saved-item.dto';

/** El tipo llega por la URL, así que se valida a mano antes de tocar la base. */
function parseKind(value: string): SavedItemKindId {
  const kind = value?.toUpperCase() as SavedItemKindId;
  if (!SAVED_ITEM_KINDS.includes(kind)) {
    throw new BadRequestException(
      `Tipo de contenido no válido: ${value}. Válidos: ${SAVED_ITEM_KINDS.join(', ')}.`,
    );
  }
  return kind;
}

@ApiTags('saved-items')
@Controller('saved-items')
@UseGuards(JwtGuard)
export class SavedItemController {
  constructor(private readonly saved: SavedItemService) {}

  @Get()
  @ApiOperation({
    summary: 'Artículos, clases y videos que el estudiante ha guardado.',
  })
  findMine(@CurrentUser() user: { id: number }) {
    return this.saved.findForUser(user.id);
  }

  @Post(':kind/:contentId/toggle')
  @ApiOperation({ summary: 'Guarda si no estaba, quita si estaba.' })
  toggle(
    @CurrentUser() user: { id: number },
    @Param('kind') kind: string,
    @Param('contentId') contentId: string,
    @Body() dto: SaveItemDto,
  ) {
    return this.saved.toggle(user.id, parseKind(kind), contentId, dto ?? {});
  }

  @Put(':kind/:contentId')
  @ApiOperation({
    summary: 'Guarda un contenido. Repetirlo actualiza la misma fila.',
  })
  save(
    @CurrentUser() user: { id: number },
    @Param('kind') kind: string,
    @Param('contentId') contentId: string,
    @Body() dto: SaveItemDto,
  ) {
    return this.saved.save(user.id, parseKind(kind), contentId, dto ?? {});
  }

  @Delete(':kind/:contentId')
  @ApiOperation({ summary: 'Quita un contenido de los guardados.' })
  remove(
    @CurrentUser() user: { id: number },
    @Param('kind') kind: string,
    @Param('contentId') contentId: string,
  ) {
    return this.saved.remove(user.id, parseKind(kind), contentId);
  }
}
