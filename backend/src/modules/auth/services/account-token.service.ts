import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type AccountTokenPurpose = 'password-change' | 'email-verify';

export interface AccountTokenPayload {
  sub: number;
  type: AccountTokenPurpose;
  email: string;
}

const TOKEN_TTL = '1h';

/**
 * Genera y valida tokens firmados (JWT) de un solo propósito para
 * el flujo de validación de correo y cambio de contraseña.
 */
@Injectable()
export class AccountTokenService {
  constructor(private readonly jwtService: JwtService) {}

  generate(userId: number, email: string, type: AccountTokenPurpose): string {
    const payload: AccountTokenPayload = { sub: userId, type, email };
    return this.jwtService.sign(payload, {
      expiresIn: TOKEN_TTL,
    });
  }

  /**
   * Verifica que el token sea válido y corresponda al propósito esperado.
   * Devuelve el payload si es válido; de lo contrario lanza 401.
   */
  verify(
    token: string,
    expectedType: AccountTokenPurpose,
  ): AccountTokenPayload {
    let payload: AccountTokenPayload;
    try {
      payload = this.jwtService.verify<AccountTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('El enlace es inválido o ha expirado.');
    }

    if (payload.type !== expectedType || !payload.sub) {
      throw new UnauthorizedException('El enlace es inválido o ha expirado.');
    }

    return payload;
  }
}
