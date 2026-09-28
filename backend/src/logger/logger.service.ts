import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import DailyRotateFile from 'winston-daily-rotate-file';

//sistema de logs en NestJS usando winston y winston-daily-rotate-file para rotar los archivos de log diariamente.
// Crear la carpeta 'storage/logs' si no existe
const logDir = path.join(__dirname, '..', 'storage', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    const transportOptions: DailyRotateFile.DailyRotateFileTransportOptions = {
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD', // Formato de fecha en el nombre del archivo
      maxFiles: '14d', // Mantener los archivos de los últimos 14 días
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    };

    this.logger = winston.createLogger({
      level: 'info',
      transports: [
        // new winston.transports.Console({
        //   format: winston.format.combine(
        //     winston.format.colorize(),
        //     winston.format.simple(),
        //   ),
        // }),
        new DailyRotateFile(transportOptions), // Rotación diaria de archivos
        new DailyRotateFile({
          filename: path.join(logDir, 'error-%DATE%.log'),
          level: 'error',
          maxFiles: '7d', // Mantener los errores de los últimos 7 días
          datePattern: 'YYYY-MM-DD', // Agregar formato de fecha para el archivo de error
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    });
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string) {
    this.logger.error(message);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }
}
