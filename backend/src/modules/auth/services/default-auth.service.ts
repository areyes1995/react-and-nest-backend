import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginAuthDto } from '../dto/login-auth.dto';
import { SystemUserDto } from 'src/modules/system-user/dto/system-user.dto';
import { AuthUserDto } from '../dto/auth-user.dto';
import { AuthService } from './interfaces/auth.service';
import { RegisterAuthDto } from '../dto/register.auth.dto';
import * as bcrypt from 'bcrypt';
import { AuthResultDto } from '../dto/auth-result.dto';
import { SystemUserService } from 'src/modules/system-user/services/interfaces/system-user.service';
import { AuthLogService } from 'src/modules/auth-log/auth-log.service';
import { PrismaService } from 'prisma/prisma.service';
import { MailerService } from 'src/modules/mailer/mailer.service';
import { AccountTokenService } from './account-token.service';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { RequestPasswordResetDto } from '../dto/request-password-reset.dto';

@Injectable()
export class DefaultAuthService implements AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject('SystemUserService')
    private systemUserService: SystemUserService,
    private authLogService: AuthLogService,
    private prisma: PrismaService,
    private mailerService: MailerService,
    private accountTokenService: AccountTokenService,
  ) {}

  async login(dto: LoginAuthDto): Promise<AuthResultDto> {
    let user: AuthUserDto;
    try {
      user = await this.systemUserService.getAuthUserByEmail(dto.email);
    } catch (error) {
      await this.safeLogEvent({ email: dto.email, event: 'LOGIN_FAILED' });
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      await this.safeLogEvent({
        userId: user.id,
        email: dto.email,
        event: 'LOGIN_FAILED',
      });
      throw new NotFoundException('Email or password are incorrect');
    }

    // ── Cuenta incompleta: bloqueo de login + envío de correo ──
    // Si el usuario debe cambiar su contraseña (aunque sea el correo no validado),
    // se envía SOLO la plantilla de cambio de contraseña. Al cambiarla, tanto
    // `mustChangePassword` como `emailVerified` quedan en true.
    if (user.mustChangePassword) {
      await this.sendPasswordChangeEmail(user);
      await this.safeLogEvent({
        userId: user.id,
        email: user.email,
        event: 'LOGIN_FAILED',
      });
      throw new ForbiddenException(
        'Tu cuenta requiere establecer una nueva contraseña. Te hemos enviado un correo para completar el proceso.',
      );
    }

    // Si la contraseña está activa pero el correo no está validado, se envía
    // SOLO la plantilla de validación de correo.
    if (!user.emailVerified) {
      await this.sendVerifyEmail(user);
      await this.safeLogEvent({
        userId: user.id,
        email: user.email,
        event: 'LOGIN_FAILED',
      });
      throw new ForbiddenException(
        'Tu correo aún no ha sido validado. Te hemos enviado un correo para confirmarlo.',
      );
    }

    await this.safeLogEvent({
      userId: user.id,
      email: dto.email,
      event: 'LOGIN_SUCCESS',
    });

    const token = this.jwtService.sign(
      { id: user.id, roles: user.roles },
      { expiresIn: '1h' },
    );
    const refreshToken = this.jwtService.sign(
      { id: user.id },
      { expiresIn: '7d' },
    );

    const result = new AuthResultDto();
    result.token = token;
    result.refreshToken = refreshToken;
    result.Expiration = new Date(Date.now() + 3600 * 1000); // 1 hour
    result.User = new SystemUserDto({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      emailVerified: user.emailVerified,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    return result;
  }

  async refresh(refreshToken: string): Promise<AuthResultDto> {
    let payload: { id: number };
    try {
      payload = this.jwtService.verify<{ id: number }>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    let user: SystemUserDto;
    try {
      user = await this.systemUserService.getById(payload.id);
    } catch {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is not active');
    }

    const token = this.jwtService.sign(
      { id: user.id, roles: user.roles },
      { expiresIn: '1h' },
    );
    const newRefreshToken = this.jwtService.sign(
      { id: user.id },
      { expiresIn: '1d' },
    );

    const result = new AuthResultDto();
    result.token = token;
    result.refreshToken = newRefreshToken;
    result.Expiration = new Date(Date.now() + 3600 * 1000); // 1 hour
    result.User = user;

    return result;
  }

  async register(dto: RegisterAuthDto): Promise<SystemUserDto> {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.systemUserService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      employeeId: dto.employeeId,
      email: dto.email,
      passwordHash,
      phoneNumber: dto.phoneNumber ?? undefined,
      role: dto.role,
    });
  }

  /**
   * Cambia la contraseña a partir de un token de "password-change".
   * Al completarse, `mustChangePassword` y `emailVerified` quedan en true.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<SystemUserDto> {
    const payload = this.accountTokenService.verify(
      dto.token,
      'password-change',
    );

    const user = await this.prisma.systemUser.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('El usuario no existe.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    const updated = await this.prisma.systemUser.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        emailVerified: true,
      },
      include: {
        roles: { include: { role: true } },
      },
    });

    return SystemUserDto.fromEntity(updated);
  }

  /**
   * Valida el correo a partir de un token de "email-verify".
   */
  async verifyEmail(dto: VerifyEmailDto): Promise<SystemUserDto> {
    const payload = this.accountTokenService.verify(dto.token, 'email-verify');

    const user = await this.prisma.systemUser.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('El usuario no existe.');
    }

    if (user.emailVerified) {
      throw new UnauthorizedException('El correo ya está validado.');
    }

    const updated = await this.prisma.systemUser.update({
      where: { id: user.id },
      data: { emailVerified: true },
      include: {
        roles: { include: { role: true } },
      },
    });

    return SystemUserDto.fromEntity(updated);
  }

  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<void> {
    const user = await this.prisma.systemUser.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user) {
      return;
    }

    const token = this.accountTokenService.generate(
      user.id,
      user.email,
      'password-change',
    );
    const link = this.mailerService.getFrontendUrl(
      `/reset-password?token=${encodeURIComponent(token)}`,
    );
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Restablece tu contraseña',
      template: 'password-change',
      vars: {
        firstName: user.firstName,
        link,
        year: String(new Date().getFullYear()),
      },
    });
  }

  private async sendPasswordChangeEmail(user: AuthUserDto): Promise<void> {
    const token = this.accountTokenService.generate(
      user.id,
      user.email,
      'password-change',
    );
    const link = this.mailerService.getFrontendUrl(
      `/reset-password?token=${encodeURIComponent(token)}`,
    );
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Establece tu contraseña',
      template: 'password-change',
      vars: {
        firstName: user.firstName,
        link,
        year: String(new Date().getFullYear()),
      },
    });
  }

  private async sendVerifyEmail(user: AuthUserDto): Promise<void> {
    const token = this.accountTokenService.generate(
      user.id,
      user.email,
      'email-verify',
    );
    const link = this.mailerService.getFrontendUrl(
      `/verify-email?token=${encodeURIComponent(token)}`,
    );
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Valida tu correo electrónico',
      template: 'verify-email',
      vars: {
        firstName: user.firstName,
        link,
        year: String(new Date().getFullYear()),
      },
    });
  }

  // El registro de auditoría nunca debe tumbar el flujo de autenticación
  private async safeLogEvent(data: {
    userId?: number;
    email?: string;
    event: 'LOGIN_SUCCESS' | 'LOGOUT' | 'LOGIN_FAILED';
  }): Promise<void> {
    try {
      await this.authLogService.logEvent(data);
    } catch (error) {
      console.error('No se pudo registrar el evento de autenticación:', error);
    }
  }
}
