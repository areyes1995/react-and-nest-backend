import { IsOptional, IsString } from 'class-validator';
import { CliValidationService } from 'src/cli/services/cli-validation.service';

class DummyDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  nick?: string;
}

describe('CliValidationService', () => {
  const service = new CliValidationService();

  it('retorna el DTO si es válido', async () => {
    const out = await service.validate(DummyDto, { name: 'Ada' });
    expect(out).toBeInstanceOf(DummyDto);
    expect(out.name).toBe('Ada');
  });

  it('lanza si falta un campo requerido', async () => {
    await expect(service.validate(DummyDto, {})).rejects.toThrow();
  });

  it('lanza si hay propiedades no permitidas (whitelist)', async () => {
    await expect(
      service.validate(DummyDto, { name: 'Ada', hack: 1 }),
    ).rejects.toThrow();
  });

  it('acepta opcionales válidos', async () => {
    const out = await service.validate(DummyDto, {
      name: 'Ada',
      nick: 'a',
    });
    expect(out.nick).toBe('a');
  });
});
