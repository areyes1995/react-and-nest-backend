import {
  Body,
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
import { ApiConsumes, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import type { Readable } from 'stream';
import { ResourceCategory } from '@prisma/client';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import { MAX_UPLOAD_BYTES, type UploadedFileLike } from '../shared/uploaded-file';
import { CreateResourceDto, UpdateResourceDto } from './dto/library.dto';
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

  @Post()
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateResourceDto,
    @UploadedFile() file?: UploadedFileLike,
  ) {
    return this.library.create(user.id, dto, file);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.library.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
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
    return new StreamableFile(file.stream as Readable);
  }
}
