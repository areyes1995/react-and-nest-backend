import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, Trash2 } from 'lucide-react'
import { aiApi } from '@services/educraft'
import type { TutorMessage } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import { Button, RichMath, Spinner } from '@components/ui'
import { Robot } from '@components/brand/Illustrations'
import { cn } from '@lib/cn'

const SUGGESTIONS = [
  '¿Cómo enseñar funciones cuadráticas?',
  'Dame una actividad para segundo grado.',
  'Explícame este error frecuente con fracciones.',
  'Crea una rúbrica de resolución de problemas.',
  'Resume esta sesión en tres ideas clave.',
  'Resuelve 3(x - 2) = x + 4',
]

/** Consola completa del Tutor Virtual Docente. */
export function TutorConsole() {
  const { error } = useFeedback()
  const [messages, setMessages] = useState<TutorMessage[] | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    aiApi.history().then(setMessages).catch(() => setMessages([]))
  }, [])
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, sending])

  const send = async (message = text) => {
    const content = message.trim()
    if (!content || sending) return
    setText('')
    setMessages((m) => [...(m ?? []), { id: -Date.now(), role: 'user', content, createdAt: new Date().toISOString() }])
    setSending(true)
    try {
      const res = await aiApi.tutor(content)
      setMessages((m) => [...(m ?? []), res.message])
    } catch (err) {
      error('El tutor no pudo responder', (err as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_17rem]">
      <div className="card flex h-[65vh] flex-col overflow-hidden">
        <div className="scroll-area flex-1 space-y-3 p-5">
          {!messages ? (
            <Spinner />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Robot size={96} />
              <p className="mt-3 text-base font-bold text-ink">¿En qué te acompaño hoy?</p>
              <p className="text-sm text-ink-3">Pregunta sobre didáctica, actividades, errores frecuentes o ejercicios.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed', m.role === 'user' ? 'rounded-br-md bg-brand-gradient text-white' : 'rounded-bl-md border border-line bg-surface-2 text-ink-2')}>
                  <RichMath text={m.content} />
                </div>
              </div>
            ))
          )}
          {sending && <p className="text-xs text-ink-3">El tutor está escribiendo…</p>}
          <div ref={endRef} />
        </div>
        <div className="flex items-end gap-2 border-t border-line p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            rows={2}
            placeholder="Escribe tu consulta pedagógica…"
            className="input flex-1 resize-none"
          />
          <Button onClick={() => send()} disabled={!text.trim() || sending} className="h-11 w-11 rounded-2xl p-0" aria-label="Enviar">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="card card-pad">
          <p className="section-title mb-2">Sugerencias</p>
          <div className="space-y-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="flex w-full items-start gap-2 rounded-xl px-2 py-1.5 text-left text-xs text-ink-2 hover:bg-surface-3">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-pink" /> {s}
              </button>
            ))}
          </div>
        </div>
        {!!messages?.length && (
          <Button
            variant="secondary"
            className="w-full"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={async () => {
              await aiApi.clearHistory()
              setMessages([])
            }}
          >
            Nueva conversación
          </Button>
        )}
      </div>
    </div>
  )
}
