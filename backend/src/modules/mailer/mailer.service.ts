import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

export type EmailTemplate = 'password-change' | 'verify-email';

/**
 * Servicio de envío de correos vía SMTP (Nodemailer).
 * Las plantillas son archivos HTML locales con placeholders `{{key}}`.
 * Si el SMTP no está configurado, los correos se loguean en consola
 * en lugar de enviarse (modo desarrollo/stub).
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transport?: nodemailer.Transporter;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    this.from =
      this.config.get<string>('MAIL_FROM') || 'Educraft XYZ <no-reply@educraft.app>';
    this.frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transport = nodemailer.createTransport({
        host,
        port: Number(this.config.get<number>('SMTP_PORT') ?? 587),
        secure: this.config.get<string>('SMTP_SECURE') === 'true',
        auth: this.config.get<string>('SMTP_USER')
          ? {
              user: this.config.get<string>('SMTP_USER'),
              pass: this.config.get<string>('SMTP_PASSWORD'),
            }
          : undefined,
      });
    } else {
      this.logger.warn(
        'SMTP_HOST no configurado: los correos se registrarán en consola (modo stub).',
      );
    }
  }

  private loadTemplate(name: EmailTemplate): string {
    const filePath = join(__dirname, 'templates', `${name}.html`);
    return readFileSync(filePath, 'utf8');
  }

  private renderTemplate(
    name: EmailTemplate,
    vars: Record<string, string>,
  ): string {
    let html = this.loadTemplate(name);
    for (const [key, value] of Object.entries(vars)) {
      html = html.split(`{{${key}}}`).join(value);
    }
    return html;
  }

  /** true si hay SMTP real; false en modo stub (correos a consola). */
  isConfigured(): boolean {
    return Boolean(this.transport);
  }

  getFrontendUrl(path = ''): string {
    return `${this.frontendUrl}${path}`;
  }

  async sendMail(options: {
    to: string;
    subject: string;
    template: EmailTemplate;
    vars: Record<string, string>;
  }): Promise<void> {
    const html = this.renderTemplate(options.template, options.vars);

    if (!this.transport) {
      this.logger.log(
        `[STUB EMAIL] to=${options.to} subject="${options.subject}"\n${html}`,
      );
      return;
    }

    await this.transport.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html,
    });
    this.logger.log(`Email enviado a ${options.to}: ${options.subject}`);
  }
}
