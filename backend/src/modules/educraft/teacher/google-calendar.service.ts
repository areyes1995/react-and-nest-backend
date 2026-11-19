// Sincronización opcional con Google Calendar mediante OAuth 2.0.
// Sin credenciales configuradas el módulo queda deshabilitado y la
// exportación ICS sigue disponible. Sin dependencias nuevas: Node 22 fetch.

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { PrismaService } from 'prisma/prisma.service';
import { CalendarService, type AgendaItem } from '../calendar/calendar.service';
import { addDays, formatDateOnly } from '../shared/dates.util';
import { sectionLabel } from '../shared/zoned.util';
import { toUtcDate } from '../calendar/calendar.util';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const MAX_EVENTS_PER_SYNC = 200;

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

export interface GoogleSyncStatus {
  configured: boolean;
  connected: boolean;
  calendarId: string | null;
  lastSyncAt: Date | null;
  expiresAt: Date | null;
  needsReconnect: boolean;
  message: string;
}

type TeacherProfileRecord = NonNullable<
  Awaited<ReturnType<PrismaService['teacherProfile']['findUnique']>>
>;

const DISABLED_MESSAGE =
  'La sincronización con Google Calendar está deshabilitada. Configura GOOGLE_CALENDAR_CLIENT_ID y GOOGLE_CALENDAR_CLIENT_SECRET. Puedes seguir usando Calendario → Exportar .ics.';
const NOT_CONNECTED_MESSAGE =
  'Aún no has conectado tu cuenta de Google Calendar.';
const CONNECTED_MESSAGE = 'Tu agenda se sincroniza con Google Calendar.';

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};
}

@Injectable()
export class GoogleCalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly calendar: CalendarService,
  ) {}

  private clientId(): string {
    return this.config.get<string>('GOOGLE_CALENDAR_CLIENT_ID')?.trim() ?? '';
  }

  private clientSecret(): string {
    return (
      this.config.get<string>('GOOGLE_CALENDAR_CLIENT_SECRET')?.trim() ?? ''
    );
  }

  private configured(): boolean {
    return Boolean(this.clientId() && this.clientSecret());
  }

  private redirectUri(): string {
    const configured = this.config
      .get<string>('GOOGLE_CALENDAR_REDIRECT_URI')
      ?.trim();
    const frontend =
      this.config.get<string>('FRONTEND_URL')?.trim() ||
      'http://localhost:5173';
    return (
      configured ||
      `${frontend.replace(/\/$/, '')}/app/ajustes?tab=preferencias`
    );
  }

  private calendarId(): string {
    return this.config.get<string>('GOOGLE_CALENDAR_ID')?.trim() || 'primary';
  }

  private encryptionKey(): Buffer {
    return createHash('sha256')
      .update(`educraft-google-calendar:${this.clientSecret()}`)
      .digest();
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    return `v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${encrypted.toString('base64')}`;
  }

  private decrypt(value: string | null): string | null {
    if (!value) return null;
    const parts = value.split(':');
    if (parts.length !== 4 || parts[0] !== 'v1') return null;
    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey(),
        Buffer.from(parts[1], 'base64'),
      );
      decipher.setAuthTag(Buffer.from(parts[2], 'base64'));
      return Buffer.concat([
        decipher.update(Buffer.from(parts[3], 'base64')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      return null;
    }
  }

  private async loadProfile(userId: number): Promise<TeacherProfileRecord> {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
    });
    return (
      profile ??
      this.prisma.teacherProfile.create({
        data: { userId, displayTitle: 'Prof.' },
      })
    );
  }

  private status(profile: TeacherProfileRecord): GoogleSyncStatus {
    const configured = this.configured();
    const connected = Boolean(
      configured && this.decrypt(profile.googleRefreshToken),
    );
    let message = DISABLED_MESSAGE;
    if (configured && connected) message = CONNECTED_MESSAGE;
    else if (configured) message = NOT_CONNECTED_MESSAGE;
    return {
      configured,
      connected,
      calendarId: profile.googleCalendarId,
      lastSyncAt: profile.googleLastSyncAt,
      expiresAt: profile.googleTokenExpiresAt,
      needsReconnect: connected && !this.decrypt(profile.googleAccessToken),
      message,
    };
  }

  async statusForUser(userId: number): Promise<GoogleSyncStatus> {
    return this.status(await this.loadProfile(userId));
  }

  private async savePreferences(
    userId: number,
    current: Prisma.JsonValue | Record<string, unknown>,
    patch: Record<string, unknown>,
  ) {
    const preferences = { ...asRecord(current as Prisma.JsonValue), ...patch };
    await this.prisma.teacherProfile.update({
      where: { userId },
      data: { preferences: preferences as Prisma.InputJsonValue },
    });
  }

  /** Paso 1: URL de autorización. El `state` se guarda en el perfil y se devuelve al cliente. */
  async oauthUrl(userId: number) {
    if (!this.configured()) {
      return {
        enabled: false as const,
        url: null,
        state: null,
        message: DISABLED_MESSAGE,
      };
    }
    const profile = await this.loadProfile(userId);
    const state = randomBytes(24).toString('hex');
    await this.savePreferences(userId, profile.preferences, {
      googleCalendarState: state,
    });
    const params = new URLSearchParams({
      client_id: this.clientId(),
      redirect_uri: this.redirectUri(),
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state,
    });
    return {
      enabled: true as const,
      url: `${AUTH_URL}?${params.toString()}`,
      state,
      message:
        'Abre la URL para autorizar el acceso a tu calendario de Google.',
    };
  }

  private async requestToken(
    fields: Record<string, string>,
  ): Promise<GoogleTokenResponse> {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields),
    });
    const data = (await response
      .json()
      .catch(() => ({}))) as GoogleTokenResponse;
    if (!response.ok) {
      throw new BadRequestException(
        data.error_description ||
          data.error ||
          'Google no pudo completar la autorización',
      );
    }
    return data;
  }

  /** Paso 2: canjea el código devuelto por Google y guarda los tokens cifrados. */
  async exchangeCode(userId: number, code: string, state: string) {
    if (!this.configured()) {
      return { ok: false as const, message: DISABLED_MESSAGE };
    }
    const profile = await this.loadProfile(userId);
    const storedState = asRecord(profile.preferences).googleCalendarState;
    if (!state || typeof storedState !== 'string' || storedState !== state) {
      throw new BadRequestException(
        'La solicitud de autorización no es válida o ha expirado',
      );
    }
    const tokens = await this.requestToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri(),
      client_id: this.clientId(),
      client_secret: this.clientSecret(),
    });
    if (!tokens.access_token) {
      throw new BadRequestException('Google no devolvió un token de acceso');
    }
    const refreshToken =
      tokens.refresh_token ?? this.decrypt(profile.googleRefreshToken) ?? null;
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;
    await this.prisma.teacherProfile.update({
      where: { userId },
      data: {
        googleAccessToken: this.encrypt(tokens.access_token),
        googleRefreshToken: refreshToken ? this.encrypt(refreshToken) : null,
        googleTokenExpiresAt: expiresAt,
        googleCalendarId: this.calendarId(),
        googleCalendarSync: true,
      },
    });
    const preferences = asRecord(profile.preferences);
    delete preferences.googleCalendarState;
    await this.savePreferences(userId, preferences, {});
    return {
      ok: true as const,
      message: CONNECTED_MESSAGE,
      status: await this.statusForUser(userId),
    };
  }

  private async refreshAccessToken(
    userId: number,
    refreshToken: string,
  ): Promise<string | null> {
    try {
      const tokens = await this.requestToken({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId(),
        client_secret: this.clientSecret(),
      });
      if (!tokens.access_token) return null;
      await this.prisma.teacherProfile.update({
        where: { userId },
        data: {
          googleAccessToken: this.encrypt(tokens.access_token),
          googleTokenExpiresAt: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000)
            : null,
          ...(tokens.refresh_token
            ? { googleRefreshToken: this.encrypt(tokens.refresh_token) }
            : {}),
        },
      });
      return tokens.access_token;
    } catch {
      return null;
    }
  }

  private googleEventBody(item: AgendaItem, calendarId: string) {
    const description = [
      item.type,
      item.section ? sectionLabel(item.section.grade, item.section.name) : '',
      item.description ?? '',
    ]
      .filter(Boolean)
      .join(' · ');
    const start = item.allDay
      ? { date: item.date }
      : {
          dateTime: toUtcDate(
            item.date,
            item.startTime ?? '00:00',
          ).toISOString(),
        };
    const end = item.allDay
      ? { date: formatDateOnly(addDays(new Date(`${item.date}T00:00:00Z`), 1)) }
      : {
          dateTime:
            item.endTime && item.startTime && item.endTime > item.startTime
              ? toUtcDate(item.date, item.endTime).toISOString()
              : new Date(
                  toUtcDate(item.date, item.startTime ?? '00:00').getTime() +
                    3_600_000,
                ).toISOString(),
        };
    return {
      summary: item.title,
      description,
      iCalUID: `${item.key}@educraft.app`,
      start,
      end,
      reminders: { useDefault: true },
      calendarId,
    };
  }

  /** Paso 3: envía la agenda a Google Calendar (iCalUID evita duplicados). */
  async sync(userId: number, from?: string, to?: string) {
    if (!this.configured()) {
      return {
        enabled: false as const,
        pushed: 0,
        skipped: 0,
        errors: [],
        message: DISABLED_MESSAGE,
      };
    }
    const profile = await this.loadProfile(userId);
    const refreshToken = this.decrypt(profile.googleRefreshToken);
    if (!refreshToken) {
      return {
        enabled: true as const,
        pushed: 0,
        skipped: 0,
        errors: [],
        message: NOT_CONNECTED_MESSAGE,
      };
    }
    let accessToken =
      this.decrypt(profile.googleAccessToken) ??
      (await this.refreshAccessToken(userId, refreshToken));
    if (!accessToken) {
      return {
        enabled: true as const,
        pushed: 0,
        skipped: 0,
        errors: [],
        message: 'La sesión con Google expiró. Vuelve a conectar tu cuenta.',
      };
    }

    const today = new Date();
    const rangeFrom = from ?? formatDateOnly(today);
    const rangeTo = to ?? formatDateOnly(addDays(today, 90));
    const items = (await this.calendar.agenda(userId, rangeFrom, rangeTo, true))
      .filter((item) => item.source === 'event' || item.source === 'holiday')
      .slice(0, MAX_EVENTS_PER_SYNC);
    const calendarId = profile.googleCalendarId || this.calendarId();
    let pushed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of items) {
      const body = this.googleEventBody(item, calendarId);
      const send = (token: string) =>
        fetch(
          `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          },
        );
      let response = await send(accessToken);
      if (response.status === 401) {
        const renewed = await this.refreshAccessToken(userId, refreshToken);
        if (renewed) {
          accessToken = renewed;
          response = await send(renewed);
        }
      }
      if (response.ok) pushed++;
      else if (response.status === 409) skipped++;
      else errors.push(`${item.title}: ${response.status}`);
    }

    await this.prisma.teacherProfile.update({
      where: { userId },
      data: { googleLastSyncAt: new Date(), googleCalendarSync: true },
    });
    return {
      enabled: true as const,
      pushed,
      skipped,
      errors: errors.slice(0, 10),
      message: `Sincronización terminada: ${pushed} evento(s) enviado(s), ${skipped} ya existían.`,
    };
  }

  /** Paso 4: borra los tokens locales y desactiva la sincronización. */
  async disconnect(userId: number) {
    const profile = await this.loadProfile(userId);
    const accessToken = this.decrypt(profile.googleAccessToken);
    if (accessToken && this.configured()) {
      try {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          },
        );
      } catch {
        // La revocación remota es mejor esfuerzo; siempre se borran los tokens locales.
      }
    }
    const preferences = asRecord(profile.preferences);
    delete preferences.googleCalendarState;
    await this.prisma.teacherProfile.update({
      where: { userId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiresAt: null,
        googleCalendarId: null,
        googleCalendarSync: false,
        googleLastSyncAt: null,
        preferences: preferences as Prisma.InputJsonValue,
      },
    });
    return { ok: true, message: 'Google Calendar fue desconectado.' };
  }
}
