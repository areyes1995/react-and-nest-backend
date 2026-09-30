import { SystemUserDto } from 'src/modules/system-user/dto/system-user.dto';
import { LoginAuthDto } from '../../dto/login-auth.dto';
import { RegisterAuthDto } from '../../dto/register.auth.dto';
import { AuthResultDto } from '../../dto/auth-result.dto';
import { ResetPasswordDto } from '../../dto/reset-password.dto';
import { VerifyEmailDto } from '../../dto/verify-email.dto';
import { RequestPasswordResetDto } from '../../dto/request-password-reset.dto';
import { SignupAuthDto, SignupResultDto } from '../../dto/signup-auth.dto';

export interface AuthService {
  login(login: LoginAuthDto): Promise<AuthResultDto>;
  refresh(refreshToken: string): Promise<AuthResultDto>;
  register(data: RegisterAuthDto): Promise<SystemUserDto>;
  signup(data: SignupAuthDto): Promise<SignupResultDto>;
  requestPasswordReset(dto: RequestPasswordResetDto): Promise<void>;
  resetPassword(dto: ResetPasswordDto): Promise<SystemUserDto>;
  verifyEmail(dto: VerifyEmailDto): Promise<SystemUserDto>;
}
