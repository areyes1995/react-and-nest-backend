// ──────────────────────────────────────────────
// UploadDocumentView — Subir un documento al índice
// (UI frontend; el endpoint de subida aún no existe)
// ──────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react'
import {
  CloudUpload,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  File,
  X,
  Sparkles,
} from 'lucide-react'
import { useAppTranslation } from '@i18n/useAppTranslation'

interface PickedFile {
  name: string
  size: number
  type: string
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`
}

export default function UploadDocumentView() {
  const { t } = useAppTranslation()
  const [file, setFile] = useState<PickedFile | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const pick = useCallback((f: File | undefined | null) => {
    if (!f) return
    setFile({ name: f.name, size: f.size, type: f.type || 'application/octet-stream' })
    setDone(false)
    setError(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    setDone(false)
    await new Promise(r => setTimeout(r, 900))
    setUploading(false)
    setDone(true)
  }, [file])

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-6">
        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border-active)] bg-[var(--bg-panel)] p-6 sm:p-8">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(242,169,59,0.14),transparent_65%)] blur-2xl" />

          <div className="relative flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#f2a93b] to-[#d18e2a] text-[#121316] shadow-[0_4px_16px_rgba(242,169,59,0.35)]">
              <CloudUpload className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('rag.upload.title')}</h2>
              <p className="text-xs text-[var(--text-muted)]">
                {t('rag.upload.subtitle')}
              </p>
            </div>
          </div>

          {/* ── Drop zone / picker ── */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              pick(e.dataTransfer.files?.[0])
            }}
            className={`mt-6 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
              dragOver
                ? 'border-[#f2a93b] bg-[#f2a93b]/5 scale-[1.01]'
                : 'border-[var(--border-active)] bg-[var(--bg-surface)] hover:border-[#f2a93b]/60'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={e => pick(e.target.files?.[0])}
            />
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-active)]">
              <Upload className="h-6 w-6 text-[#f2a93b]" strokeWidth={2} />
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
              {dragOver ? t('rag.upload.dropHere') : t('rag.upload.dragOrClick')}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {t('rag.upload.fileTypes')}
            </p>
          </div>

          {/* ── Archivo seleccionado ── */}
          {file && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border-active)] bg-[var(--bg-surface)] p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/25 to-orange-500/10 text-amber-300 border border-amber-400/30">
                <File className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{file.name}</p>
                <p className="text-caption text-[var(--text-muted)]">{formatSize(file.size)} · {file.type}</p>
              </div>
              <button
                onClick={() => {
                  setFile(null)
                  setDone(false)
                }}
                className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-panel)] hover:text-[var(--text-primary)]"
                title={t('rag.upload.removeFile')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {done && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {t('rag.upload.received')}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!file || uploading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f2a93b] to-[#d18e2a] px-5 py-2.5 text-sm font-semibold text-[#121316] shadow-[0_4px_16px_rgba(242,169,59,0.3)] transition hover:shadow-[0_4px_24px_rgba(242,169,59,0.45)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {uploading ? (
              <>
                <FileText className="h-4 w-4 animate-pulse" />
                {t('rag.upload.processing')}
              </>
            ) : (
              <>
                <CloudUpload className="h-4 w-4" strokeWidth={2} />
                {file ? t('rag.upload.submit', { name: file.name }) : t('rag.upload.selectFile')}
              </>
            )}
          </button>
        </div>

        {/* ── Nota ── */}
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#f2a93b]" strokeWidth={2} />
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {t('rag.upload.frontendOnly')}
          </p>
        </div>
      </div>
    </div>
  )
}