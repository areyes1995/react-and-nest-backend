import { Injectable } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class CliValidationService {
  async validate<T extends object>(
    cls: ClassConstructor<T>,
    data: unknown,
  ): Promise<T> {
    const dto = plainToInstance(cls, data);

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    });

    if (errors.length) {
      const message = errors
        .map((e) => Object.values(e.constraints ?? {}).join(', '))
        .filter(Boolean)
        .join('\n');

      throw new Error(message || 'Datos inválidos');
    }

    return dto;
  }
}
