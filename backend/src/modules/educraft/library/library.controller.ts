import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { Readable } from 'stream';
import { ResourceCategory } from '@prisma/client';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import {
  MAX_UPLOAD_BYTES,
  type UploadedFileLike,
} from '../shared/uploaded-file';
import {
  BulkTagsDto,
  CreateResourceDto,
  ShareResourceDto,
  UpdateResourceDto,
} from './dto/library.dto';
import { LibraryService } from './library.service';

@EducraftController('library', 'Biblioteca de recursos', 'library:manage')
export class LibraryController {
  constructor(private readonly library: LibraryService) {}

  @Get()
  @ApiQuery({ name: 'category', required: false, enum: ResourceCategory })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'tag', required: false })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('category') category?: ResourceCategory,
    @Query('q') q?: string,
    @Query('tag') tag?: string,
  ) {
    return this.library.list(user.id, { category, q, tag });
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.library.summary(user.id);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Detalle del recurso.' })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.library.get(user.id, id);
  }

  @Post()
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateResourceDto,
    @UploadedFile() file?: UploadedFileLike,
  ) {
    return this.library.create(user.id, dto, file);
  }

  @Put(':id')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateResourceDto,
    @UploadedFile() file?: UploadedFileLike,
  ) {
    return this.library.update(user.id, id, dto, file);
  }

  @Post(':id/replace-file')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  replaceFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: UploadedFileLike,
  ) {
    if (!file) throw new BadRequestException('Selecciona un archivo');
    return this.library.replaceFile(user.id, id, file);
  }

  @Post(':id/tags')
  bulkTags(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BulkTagsDto,
  ) {
    return this.library.bulkTags(user.id, id, dto);
  }

  @Post(':id/share')
  @ApiResponse({
    status: 201,
    description: 'Enlace público firmado de solo lectura.',
  })
  share(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ShareResourceDto,
  ) {
    return this.library.share(user.id, id, dto?.days);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.library.remove(user.id, id);
  }

  @Get(':id/file')
  async file(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.library.file(user.id, id);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.fileName)}"`,
    });
    return new StreamableFile(file.stream);
  }
}

/** Enlace público firmado: solo lectura, sin sesión y con caducidad. */
@ApiTags('Biblioteca pública')
@Controller('public/library/share')
export class PublicLibraryShareController {
  constructor(private readonly library: LibraryService) {}

  @Get(':token')
  @Public()
  @ApiResponse({
    status: 200,
    description: 'Archivo compartido (solo lectura).',
  })
  @ApiResponse({ status: 404, description: 'Enlace inválido o expirado.' })
  async file(
    @Param('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.library.publicSharedFile(token);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.fileName)}"`,
      'Cache-Control': 'private, max-age=3600',
    });
    return new StreamableFile(file.stream);
  }
}
