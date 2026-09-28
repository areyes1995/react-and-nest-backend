import { Logger } from '@nestjs/common';
import { CommandRunner } from 'nest-commander';

/**
 * Clase base para todos los comandos CLI.
 * Provee helpers de salida consistentes (éxito / error) y un logger
 * nombrado por la subclase concreta.
 */
export abstract class BaseCommand extends CommandRunner {
  protected readonly logger = new Logger(this.constructor.name);

  protected success(message: string): void {
    console.log(`✅ ${message}`);
  }

  protected error(message: string): void {
    console.error(`❌ ${message}`);
  }
}