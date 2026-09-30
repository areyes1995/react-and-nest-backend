import { useState } from 'react'
import { Coffee, Lightbulb, Ticket } from 'lucide-react'
import { aiApi } from '@services/educraft'
import { useFeedback } from '@context/ToastContext'
import { Button, Modal, RichMath } from '@components/ui'

type Command = 'PROBLEM_OF_DAY' | 'ACTIVE_BREAK' | 'EXIT_TICKET'
export type QuickResult = Awaited<ReturnType<typeof aiApi.quick>>

const COMMANDS: Array<{ key: Command; label: string; icon: React.ReactNode }> = [
  { key: 'PROBLEM_OF_DAY', label: 'Redactar problema del día', icon: <Lightbulb className="h-4 w-4 text-amber-500" /> },
  { key: 'ACTIVE_BREAK', label: 'Sugerir pausa activa', icon: <Coffee className="h-4 w-4 text-emerald-500" /> },
  { key: 'EXIT_TICKET', label: 'Crear ejercicio de salida (Exit Ticket)', icon: <Ticket className="h-4 w-4 text-pink-500" /> },
]

/** Menú contextual del robot: comandos rápidos de un solo clic. */
export function QuickAiMenu({ onResult, onClose }: { onResult: (r: QuickResult) => void; onClose: () => void }) {
  const { error } = useFeedback()
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState<Command | null>(null)

  const run = async (command: Command) => {
    setLoading(command)
    try {
      const result = await aiApi.quick(command, topic || undefined)
      onClose()
      onResult(result)
    } catch (err) {
      error('No se pudo generar', (err as Error).message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-3">
      <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Tema (opcional): fracciones…" className="input mb-2 h-9 text-xs" />
      <div className="space-y-0.5">
        {COMMANDS.map((c) => (
          <button key={c.key} disabled={!!loading} onClick={() => run(c.key)} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-ink-2 hover:bg-surface-3 hover:text-ink disabled:opacity-50">
            {c.icon} {loading === c.key ? 'Generando…' : c.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function QuickResultModal({ result, onClose }: { result: QuickResult | null; onClose: () => void }) {
  const { success } = useFeedback()
  return (
    <Modal
      open={!!result}
      onClose={onClose}
      title={result?.title}
      size="md"
      footer={
        <Button
          variant="secondary"
          onClick={() => {
            void navigator.clipboard.writeText(`${result?.text}${result?.answer ? `\nRespuesta: ${result.answer}` : ''}`)
            success('Copiado')
          }}
        >
          Copiar
        </Button>
      }
    >
      {result && (
        <div className="space-y-3 text-sm text-ink-2">
          <RichMath text={result.text} className="text-base text-ink" />
          {result.procedure && (
            <ol className="list-decimal space-y-1 pl-5">
              {result.procedure.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          )}
          {result.answer && <p className="rounded-xl bg-soft-green px-3 py-2 font-semibold text-emerald-700 dark:text-emerald-300">Respuesta: {result.answer}</p>}
        </div>
      )}
    </Modal>
  )
}
