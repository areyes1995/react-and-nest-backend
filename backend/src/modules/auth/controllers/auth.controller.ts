import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Inject,
  Res,
} from '@nestjs/common';
import { JwtGuard } from '../guards/jwt.guard';
import { AuthService } from '../services/interfaces/auth.service';
import { LoginAuthDto } from '../dto/login-auth.dto';
import { RefreshAuthDto } from '../dto/refresh-auth.dto';
import { RegisterAuthDto } from '../dto/register.auth.dto';
import { AuthResultDto } from '../dto/auth-result.dto';
import { Roles } from '../decorators/roles.decorator';
import { Public } from '../decorators/public.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { ROLES } from '../constants/roles.constants';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { SystemUserService } from 'src/modules/system-user/services/interfaces/system-user.service';
import { AuthLogService } from 'src/modules/auth-log/auth-log.service';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { RequestPasswordResetDto } from '../dto/request-password-reset.dto';
import { SignupAuthDto, SignupResultDto } from '../dto/signup-auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AuthService') private readonly authService: AuthService,
    @Inject('SystemUserService')
    private readonly systemUserService: SystemUserService,
    private readonly authLogService: AuthLogService,
  ) {}

  @Post('login')
  @Public()
  @ApiResponse({ status: 201, description: 'User logged in successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body() dto: LoginAuthDto,
    @Req() request,
    @Res({ passthrough: true }) response,
  ) {
    const result: AuthResultDto = await this.authService.login(dto);

    response.cookie('access_token', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: result.Expiration,
      maxAge: 3600 * 1000, // 1 hour
    });

    // Devolver el objeto completo con token, refreshToken y user
    return {
      token: result.token,
      refreshToken: result.refreshToken,
      Expiration: result.Expiration,
      User: result.User,
    };
  }

  @Post('signup')
  @Public()
  @ApiResponse({
    status: 201,
    description:
      'Cuenta docente creada. Devuelve la sesión o indica que falta validar el correo.',
    type: SignupResultDto,
  })
  @ApiResponse({ status: 409, description: 'El correo ya está registrado.' })
  async signup(@Body() dto: SignupAuthDto): Promise<SignupResultDto> {
    return this.authService.signup(dto);
  }

  @Post('refresh')
  @Public()
  @ApiResponse({
    status: 201,
    description: 'Nuevos access + refresh tokens emitidos.',
    type: AuthResultDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado.',
  })
  async refresh(@Body() dto: RefreshAuthDto): Promise<AuthResultDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('register')
  @Roles(ROLES.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @ApiResponse({ status: 201, description: 'User registered successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async register(@Body() dto: RegisterAuthDto) {
    return await this.authService.register({ ...dto });
  }

  @Post('reset-password')
  @Public()
  @ApiResponse({ status: 201, description: 'Password changed successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('verify-email')
  @Public()
  @ApiResponse({ status: 201, description: 'Email verified successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token.' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('request-password-reset')
  @Public()
  @ApiResponse({ status: 200, description: 'Password reset email sent if user exists.' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    await this.authService.requestPasswordReset(dto);
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @ApiResponse({ status: 200, description: 'User logged out successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async logout(@Req() request, @Res({ passthrough: true }) response) {
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });

    // Auditoría: el fallo del log no debe impedir cerrar sesión
    try {
      await this.authLogService.logEvent({
        userId: request.user?.id,
        event: 'LOGOUT',
      });
    } catch (error) {
      console.error('No se pudo registrar el evento de logout:', error);
    }
  }

  @Get('me')
  @UseGuards(JwtGuard)
  @ApiResponse({ status: 200, description: 'Returns the current user.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async me(@Req() request) {
    const user = await this.systemUserService.getById(request.user.id);
    return user;
  }
}
