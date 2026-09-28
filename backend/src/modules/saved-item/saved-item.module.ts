import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { SavedItemController } from './controllers/saved-item.controller';
import { SavedItemService } from './services/saved-item.service';

/**
 * Biblioteca personal del estudiante: lo que marca con el icono de guardar
 * en artículos, clases y videos. Solo guarda la referencia al contenido.
 */
@Module({
  imports: [PrismaModule],
  controllers: [SavedItemController],
  providers: [SavedItemService],
  exports: [SavedItemService],
})
export class SavedItemModule {}
