import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { TableThemeController } from './controllers/table-theme.controller';
import { TableThemeService } from './services/table-theme.service';

/**
 * Estilo visual por defecto de la mesa de práctica. El catálogo de estilos
 * vive en el frontend; el backend solo recuerda cuál eligió el administrador.
 */
@Module({
  imports: [PrismaModule],
  controllers: [TableThemeController],
  providers: [TableThemeService],
})
export class TableThemeModule {}
