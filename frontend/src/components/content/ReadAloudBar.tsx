// ──────────────────────────────────────────────
// ReadAloudBar — el reproductor de "escuchar la
// clase". Se queda pegado arriba mientras se lee,
// así los controles siempre están a mano.
//
// Ajustes: idioma del audio (por defecto el de
// Ajustes) y voz de ese idioma, del sistema o en
// línea. Mientras se prepara el audio se avisa.
// ──────────────────────────────────────────────

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Headphones, Loader2, Pause, Play, Settings2, SkipBack, SkipForward, Square } from 'lucide-react'
import { languageLabel, type ReadAloud } from '@features/speech/useReadAloud'

const RATES = [0.75, 1, 1.25, 1.5]

/** Tres barras que laten mientras suena la voz. */
function Equalizer({ active }: { active: boolean }) {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-[var(--poker-gold)] ${active ? 'animate-speech-bar' : ''}`}
          style={{ height: active ? undefined : 4, animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  )
}

export interface ReadAloudBarProps {
  reader: ReadAloud
  /** Número de segmentos, para el "3 / 12". */
  total: number
  /** Solo en lectura paso a paso: seguir leyendo el siguiente paso al acabar. */
  autoAdvance?: { value: boolean; onChange: (value: boolean) => void }
}

export default function ReadAloudBar({ reader, total, autoAdvance }: ReadAloudBarProps) {
  const [showSettings, setShowSettings] = useState(false)
  const { t: translate } = useTranslation()
  const t = (key: string, options?: Record<string, unknown>) => translate(`readAloud.${key}`, options)

  if (!reader.supported) return null

  const active = reader.status !== 'idle'
  const voice = reader.voices.find(option => option.id === reader.voiceId)
  const langName = languageLabel(reader.lang, reader.uiLang)
  const currentVoiceLabel = voice ? `${voice.label} · ${langName}` : langName
  const waiting = reader.buffering && reader.status === 'playing'

  const iconButton =
    'grid place-items-center w-9 h-9 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition'
  const selectClass =
    'rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-sm text-[var(--text-primary)]'

  return (
    <div
      // z-[45]: por encima de las mesas con audio (sus overlays van en z-40)
      // y por debajo de modales y menús (z-50).
      className={`sticky top-0 z-[45] overflow-hidden rounded-2xl border backdrop-blur-md transition-colors ${
        active
          ? 'border-[#f2a93b]/40 bg-[color-mix(in_srgb,var(--bg-panel)_88%,transparent)] shadow-lg shadow-black/20'
          : 'border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-panel)_92%,transparent)]'
      }`}
    >
      <div className="flex items-center gap-3 p-2.5 pl-3">
        {!active ? (
          <>
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-[#f2a93b]/12 text-[var(--poker-gold)] shrink-0">
              <Headphones className="w-[1.125rem] h-[1.125rem]" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{t('title')}</p>
              <p className="text-xs text-[var(--text-muted)] truncate" translate="no">
                {currentVoiceLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => reader.play(0)}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 shrink-0"
              style={{ background: 'var(--poker-gold)' }}
            >
              <Play className="w-4 h-4" fill="currentColor" strokeWidth={0} />
              {t('listen')}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={reader.status === 'playing' ? reader.pause : reader.resume}
              aria-label={reader.status === 'playing' ? t('pause') : t('resume')}
              className="grid place-items-center w-10 h-10 rounded-full text-black transition hover:brightness-110 shrink-0"
              style={{ background: 'var(--poker-gold)' }}
            >
              {reader.status === 'playing' ? (
                <Pause className="w-4 h-4" fill="currentColor" strokeWidth={0} />
              ) : (
                <Play className="w-4 h-4 translate-x-px" fill="currentColor" strokeWidth={0} />
              )}
            </button>
            <button type="button" onClick={reader.previous} aria-label={t('previous')} className={iconButton}>
              <SkipBack className="w-4 h-4" strokeWidth={2} />
            </button>
            <button type="button" onClick={reader.next} aria-label={t('next')} className={iconButton}>
              <SkipForward className="w-4 h-4" strokeWidth={2} />
            </button>

            <div className="min-w-0 flex-1 flex items-center gap-2.5" aria-live="polite">
              {waiting ? (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin text-[var(--poker-gold)]" strokeWidth={2.5} />
              ) : (
                <Equalizer active={reader.status === 'playing'} />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight truncate">
                  {waiting ? t('preparing') : reader.status === 'playing' ? t('reading') : t('paused')}
                </p>
                <p className="text-caption text-[var(--text-muted)] tabular-nums truncate">
                  {t('block', { current: (reader.current ?? 0) + 1, total })}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const i = RATES.indexOf(reader.rate)
                reader.setRate(RATES[(i + 1) % RATES.length])
              }}
              title={t('speed')}
              className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-bold tabular-nums text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-active)] transition shrink-0"
            >
              {reader.rate}×
            </button>
            <button type="button" onClick={reader.stop} aria-label={t('stop')} className={iconButton}>
              <Square className="w-3.5 h-3.5" fill="currentColor" strokeWidth={0} />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setShowSettings(open => !open)}
          aria-expanded={showSettings}
          aria-label={t('settings')}
          className={`${iconButton} ${showSettings ? 'bg-[var(--bg-surface)] text-[var(--text-primary)]' : ''}`}
        >
          <Settings2 className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      {/* Mientras se genera: qué pasa y cuánto dura, con una barra que se mueve. */}
      {waiting && (
        <div className="border-t border-[var(--border)] px-3 pt-2 pb-2.5 animate-fade-in">
          <p className="text-xs text-[var(--text-secondary)]">
            {t('waiting')}
          </p>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
            <div className="h-full w-1/3 animate-read-aloud-wait rounded-full bg-[var(--poker-gold)]" />
          </div>
        </div>
      )}

      {(reader.error || (reader.missingVoice && (active || showSettings))) && (
        <p className="border-t border-[var(--border)] px-3 py-2 text-xs leading-relaxed text-amber-400">
          {reader.error ?? t('missingVoice')}
        </p>
      )}

      {showSettings && (
        <div className="border-t border-[var(--border)] px-3 py-3 grid gap-3 sm:grid-cols-2 animate-fade-in">
          <label className="grid gap-1 text-xs text-[var(--text-muted)]">
            {t('language')}
            <select
              value={reader.audioLang}
              onChange={event => reader.setAudioLang(event.target.value)}
              className={selectClass}
              translate="no"
            >
              <option value="auto">
                {t('auto', { lang: languageLabel(reader.uiLang, reader.uiLang) })}
              </option>
              {reader.languages.map(code => (
                <option key={code} value={code}>
                  {languageLabel(code, reader.uiLang)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-[var(--text-muted)]">
            {t('voice')}
            <select
              value={reader.voiceId ?? ''}
              onChange={event => reader.setVoice(event.target.value)}
              className={selectClass}
              translate="no"
              disabled={reader.voices.length === 0}
            >
              {reader.voices.length === 0 && <option value="">{t('noVoices')}</option>}
              {(['system', 'cloud'] as const).map(source => {
                const options = reader.voices.filter(option => option.source === source)
                if (options.length === 0) return null
                return (
                  <optgroup key={source} label={t(source === 'system' ? 'systemVoices' : 'cloudVoices')}>
                    {options.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.detail ? `${option.label} — ${option.detail}` : option.label}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </label>

          <div className="grid gap-1 text-xs text-[var(--text-muted)] sm:col-span-2">
            {t('speed')}
            <div className="flex gap-1">
              {RATES.map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => reader.setRate(rate)}
                  aria-pressed={reader.rate === rate}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold tabular-nums transition ${
                    reader.rate === rate
                      ? 'bg-[var(--poker-gold)] text-black'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {rate}×
                </button>
              ))}
            </div>
          </div>

          {autoAdvance && (
            <label className="sm:col-span-2 flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={autoAdvance.value}
                onChange={event => autoAdvance.onChange(event.target.checked)}
                className="accent-[var(--poker-gold)]"
              />
              {t('autoAdvance')}
            </label>
          )}
        </div>
      )}
    </div>
  )
}
