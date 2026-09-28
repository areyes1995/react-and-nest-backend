import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca una ruta como pública: JwtGuard la deja pasar sin validar token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
