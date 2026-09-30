/** Archivo recibido por `FileInterceptor` (multer, almacenamiento en memoria). */
export interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
