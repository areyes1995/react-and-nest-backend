import { Inject } from '@nestjs/common';
import { Command, Option } from 'nest-commander';
import { BaseCommand } from '../../base/base-command';
import { CreateAdminCliDto } from '../../dto/create-admin-cli.dto';
import { CliValidationService } from '../../services/cli-validation.service';
import { SystemUserService } from 'src/modules/system-user/services/interfaces/system-user.service';

interface CreateAdminOptions {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  role?: string;
}

@Command({
  name: 'user:create-admin',
  description: 'Create an administrator or basic user',
})
export class CreateAdminCommand extends BaseCommand {
  constructor(
    @Inject('SystemUserService')
    private readonly userService: SystemUserService,
    @Inject('CliValidationService')
    private readonly validator: CliValidationService,
  ) {
    super();
  }

  async run(_params: string[], options: CreateAdminOptions): Promise<void> {
    try {
      const dto = await this.validator.validate(CreateAdminCliDto, options);

      await this.userService.createAdmin(dto);

      this.success('User created.');
    } catch (err) {
      this.error(
        err instanceof Error
          ? err.message
          : 'Unexpected error creating user',
      );
      process.exitCode = 1;
    }
  }

  @Option({
    flags: '-e, --email <email>',
    description: 'User email address',
  })
  parseEmail(val: string): string {
    return val.trim();
  }

  @Option({
    flags: '-p, --password <password>',
    description: 'User password (min 8 characters)',
  })
  parsePassword(val: string): string {
    return val.trim();
  }

  @Option({
    flags: '--first-name <firstName>',
    description: 'User first name',
  })
  parseFirstName(val: string): string {
    return val.trim();
  }

  @Option({
    flags: '--last-name <lastName>',
    description: 'User last name',
  })
  parseLastName(val: string): string {
    return val.trim();
  }

  @Option({
    flags: '--employee-id <employeeId>',
    description: 'User employee ID',
  })
  parseEmployeeId(val: string): string {
    return val.trim();
  }

  @Option({
    flags: '--role <role>',
    description: 'User role (ADMIN, USER or GUEST, default: ADMIN)',
  })
  parseRole(val: string): string {
    return val.trim().toUpperCase();
  }
}
