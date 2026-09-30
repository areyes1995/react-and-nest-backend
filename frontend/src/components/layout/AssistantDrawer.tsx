import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, FileUp, Lightbulb, Send, Sparkles, Trash2 } from 'lucide-react'
import { useAssistant } from '@context/AssistantContext'
import { useFeedback } from '@context/ToastContext'
import { aiApi, curriculumApi } from '@services/educraft'
import type { CurriculumGrade, TutorMessage } from '@services/types'
import { Drawer, RichMath, Select } from '@components/ui'
import { Robot } from '@components/brand/Illustrations'
import { readDocumentText } from '@lib/pdf'
import { cn } from '@lib/cn'

const QUICK = [
  { label: 'Generar Rúbrica', icon: <ClipboardList className="h-3.5 w-3.5" />, prompt: 'Crea una rúbrica para evaluar la resolución de problemas de ' },
  { label: 'Explicar Error Común', icon: <Lightbulb className="h-3.5 w-3.5" />, prompt: 'Explícame el error frecuente de mis estudiantes con ' },
]

/** Chat deslizable con el Tutor Virtual Docente. */
export function AssistantDrawer() {
  const assistant = useAssistant()
  const { error } = useFeedback()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [grades, setGrades] = useState<CurriculumGrade[]>([])
  const [gradeId, setGradeId] = useState<number | ''>('')
  const fileRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!assistant.isOpen) return
    const prefill = assistant.consumePrefill()
    if (prefill) setText(prefill)
    if (!loaded) {
      aiApi.history().then(setMessages).catch(() => undefined).finally(() => setLoaded(true))
      curriculumApi.grades().then((g) => {
        setGrades(g)
        if (g.length) setGradeId(g[0].id)
      }).catch(() => undefined)
    }
    setTimeout(() => inputRef.current?.focus(), 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistant.isOpen])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const send = async (message = text) => {
    const content = message.trim()
    if (!content || sending) return
    setText('')
    const temp: TutorMessage = { id: -Date.now(), role: 'user', content, createdAt: new Date().toISOString() }
    setMessages((m) => [...m, temp])
    setSending(true)
    try {
      const res = await aiApi.tutor(content)
      setMessages((m) => [...m, res.message])
    } catch (err) {
      error('El tutor no pudo responder', (err as Error).message)
    } finally {
      setSending(false)
    }
  }

  const clear = async () => {
    await aiApi.clearHistory().catch(() => undefined)
    setMessages([])
  }

  const convertDocument = async (file: File) => {
    if (!gradeId) return
    setSending(true)
    setMessages((m) => [...m, { id: -Date.now(), role: 'user', content: `Convertir “${file.name}” en una sesión de clase.`, createdAt: new Date().toISOString() }])
    try {
      const text = await readDocumentText(file)
      const res = await aiApi.documentToSession({ gradeId: Number(gradeId), text })
      assistant.close()
      navigate('/app/planificacion/planes/nuevo', { state: { draft: res.plan } })
    } catch (err) {
      error('No se pudo convertir el documento', (err as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Drawer
      open={assistant.isOpen}
      onClose={assistant.close}
      width="max-w-lg"
      title="Tutor Virtual Docente"
      subtitle="Tu asistente inteligente para la enseñanza"
      icon={<Robot size={40} />}
      footer={
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q.label}
                onClick={() => {
                  setText(q.prompt)
                  inputRef.current?.focus()
                }}
                className="chip"
              >
                {q.icon} {q.label}
              </button>
            ))}
            <button onClick={() => fileRef.current?.click()} className="chip" disabled={!gradeId}>
              <FileUp className="h-3.5 w-3.5" /> Convertir PDF a Sesión
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void convertDocument(f)
              }}
            />
          </div>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send()
                }
              }}
              rows={2}
              placeholder="Pregúntale al tutor… (Enter para enviar)"
              className="input flex-1 resize-none"
            />
            <button
              onClick={() => send()}
              disabled={!text.trim() || sending}
              className="btn btn-primary h-11 w-11 rounded-2xl p-0"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[0.7rem] text-ink-3">
              Grado para convertir documentos
              <Select
                value={gradeId}
                onChange={(e) => setGradeId(Number(e.target.value))}
                options={grades.map((g) => ({ value: g.id, label: g.name }))}
                className="h-8 w-auto py-0 text-xs"
              />
            </label>
            {messages.length > 0 && (
              <button onClick={clear} className="inline-flex items-center gap-1 text-[0.7rem] text-ink-3 hover:text-brand-red">
                <Trash2 className="h-3 w-3" /> Limpiar chat
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-3 p-5">
        {messages.length === 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-pink-50 to-violet-50 p-4 text-sm text-ink-2 dark:from-pink-950/30 dark:to-violet-950/30">
            <p className="font-semibold text-ink">¡Hola! Soy tu tutor virtual.</p>
            <p className="mt-1">Pregúntame cómo enseñar un tema, pídeme actividades, rúbricas o que resuelva un ejercicio paso a paso.</p>
            <div className="mt-3 space-y-1.5">
              {['¿Cómo enseñar funciones cuadráticas?', 'Dame una actividad para segundo grado', 'Resuelve 2x + 5 = 13'].map((p) => (
                <button key={p} onClick={() => send(p)} className="flex w-full items-center gap-2 rounded-xl bg-surface px-3 py-2 text-left text-xs font-semibold text-ink-2 shadow-sm hover:text-brand-purple">
                  <Sparkles className="h-3.5 w-3.5 text-brand-pink" /> {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                m.role === 'user' ? 'rounded-br-md bg-brand-gradient text-white' : 'rounded-bl-md border border-line bg-surface-2 text-ink-2',
              )}
            >
              <RichMath text={m.content} />
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <span className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-brand-pink [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-brand-purple [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-brand-blue" />
            </span>
            El tutor está escribiendo…
          </div>
        )}
        <div ref={endRef} />
      </div>
    </Drawer>
  )
}
