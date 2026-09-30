import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, FileText, Search, Sparkles, UserRound, X } from 'lucide-react'
import { teacherApi } from '@services/educraft'
import type { SearchResults } from '@services/types'
import { useDebounce } from '@hooks/useDebounce'
import { useLocalStorage } from '@hooks/useLocalStorage'
import { cn } from '@lib/cn'
import { RESOURCE_CATEGORIES, INSTRUMENT_TYPES } from '@lib/labels'

type Scope = 'all' | 'resources' | 'evaluations' | 'students'

const SCOPES: Array<{ key: Scope; label: string; icon: string; className: string }> = [
  { key: 'all', label: 'Todo', icon: '🔍', className: 'bg-soft-pink text-pink-600' },
  { key: 'resources', label: 'Recursos', icon: '📚', className: 'bg-soft-purple text-violet-600' },
  { key: 'evaluations', label: 'Evaluaciones', icon: '📝', className: 'bg-soft-orange text-orange-600' },
  { key: 'students', label: 'Estudiantes', icon: '👤', className: 'bg-soft-green text-emerald-600' },
]

const SESSION_PREFIX = /^dise[ñn]ar sesi[oó]n de\s+/i

/** Barra de búsqueda inteligente con panel desplegable y sugerencia IA. */
export function SearchBox() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useLocalStorage<string[]>('educraft_recent_searches', ['Función cuadrática', 'Rúbrica de polinomios'])
  const debounced = useDebounce(text, 250)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const term = debounced.trim()
    if (term.length < 2 || SESSION_PREFIX.test(term)) {
      setResults(null)
      return
    }
    let alive = true
    setLoading(true)
    teacherApi
      .search(term, scope)
      .then((r) => alive && setResults(r))
      .catch(() => alive && setResults(null))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [debounced, scope])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const close = () => {
    setOpen(false)
    inputRef.current?.blur()
  }

  const go = (path: string, remember?: string) => {
    if (remember) setRecent((r) => [remember, ...r.filter((x) => x !== remember)].slice(0, 6))
    close()
    setText('')
    navigate(path)
  }

  const submit = () => {
    const term = text.trim()
    if (!term) return
    if (SESSION_PREFIX.test(term)) {
      go(`/app/ia?tool=sesion&topic=${encodeURIComponent(term.replace(SESSION_PREFIX, ''))}`, term)
      return
    }
    setRecent((r) => [term, ...r.filter((x) => x !== term)].slice(0, 6))
  }

  const sessionTopic = SESSION_PREFIX.test(text) ? text.replace(SESSION_PREFIX, '').trim() : ''
  const hasResults =
    results && (results.students.length || results.lessonPlans.length || results.resources.length || results.evaluations.length)

  return (
    <div className="relative w-full max-w-md">
      {open && createPortal(<div className="fixed inset-0 z-[55] bg-[var(--overlay)]" onClick={close} />, document.body)}
      <div className={cn('relative', open && 'z-[60]')}>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') close()
          }}
          placeholder="Buscar en Educraft XYZ…"
          className={cn(
            'h-11 w-full border border-line bg-surface pl-11 pr-10 text-sm text-ink shadow-card outline-none transition placeholder:text-ink-3',
            open ? 'rounded-t-2xl border-b-transparent' : 'rounded-full',
          )}
        />
        {text && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" onClick={() => setText('')} aria-label="Limpiar">
            <X className="h-4 w-4" />
          </button>
        )}

        {open && (
          <div className="absolute inset-x-0 top-full animate-fade-in rounded-b-2xl border border-t-0 border-line bg-surface p-4 shadow-pop">
            <div className="mb-3 flex flex-wrap gap-2">
              {SCOPES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setScope(s.key)}
                  className={cn('pill px-3 py-1 text-xs transition', s.className, scope === s.key ? 'ring-2 ring-violet-300 dark:ring-violet-700' : 'opacity-75 hover:opacity-100')}
                >
                  <span>{s.icon}</span> {s.label}
                </button>
              ))}
            </div>

            {sessionTopic ? (
              <button
                onClick={submit}
                className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-pink-50 to-violet-50 p-3 text-left dark:from-pink-950/30 dark:to-violet-950/30"
              >
                <Sparkles className="h-5 w-5 text-brand-pink" />
                <span className="text-sm text-ink">
                  Generar con IA la sesión <b>“{sessionTopic}”</b>
                </span>
              </button>
            ) : text.trim().length >= 2 ? (
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {loading && <p className="text-xs text-ink-3">Buscando…</p>}
                {!loading && !hasResults && <p className="text-xs text-ink-3">Sin resultados para “{text}”.</p>}
                {results?.students.length ? (
                  <Group title="Estudiantes">
                    {results.students.map((s) => (
                      <ResultRow key={`s${s.id}`} icon={<UserRound className="h-4 w-4 text-emerald-500" />} title={s.name} meta={s.section} onClick={() => go(`/app/estudiantes/${s.id}`, s.name)} />
                    ))}
                  </Group>
                ) : null}
                {results?.lessonPlans.length ? (
                  <Group title="Planes de clase">
                    {results.lessonPlans.map((p) => (
                      <ResultRow key={`p${p.id}`} icon={<BookOpen className="h-4 w-4 text-violet-500" />} title={p.title} meta={p.topic} onClick={() => go(`/app/planificacion/planes/${p.id}`, p.title)} />
                    ))}
                  </Group>
                ) : null}
                {results?.resources.length ? (
                  <Group title="Recursos">
                    {results.resources.map((r) => (
                      <ResultRow key={`r${r.id}`} icon={<FileText className="h-4 w-4 text-pink-500" />} title={r.title} meta={RESOURCE_CATEGORIES[r.category].label} onClick={() => go(`/app/recursos?q=${encodeURIComponent(r.title)}`, r.title)} />
                    ))}
                  </Group>
                ) : null}
                {results?.evaluations.length ? (
                  <Group title="Evaluaciones">
                    {results.evaluations.map((e) => (
                      <ResultRow
                        key={`e${e.kind}${e.id}`}
                        icon={<FileText className="h-4 w-4 text-orange-500" />}
                        title={e.title}
                        meta={e.kind === 'EXAM' ? 'Examen' : INSTRUMENT_TYPES[e.kind as keyof typeof INSTRUMENT_TYPES]}
                        onClick={() => go(e.kind === 'EXAM' ? `/app/evaluacion/examenes/${e.id}` : `/app/evaluacion?tab=instrumentos&id=${e.id}`, e.title)}
                      />
                    ))}
                  </Group>
                ) : null}
              </div>
            ) : (
              <>
                <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wide text-ink-3">Búsquedas recientes</p>
                <ul className="mb-3 space-y-1">
                  {recent.map((r) => (
                    <li key={r}>
                      <button onClick={() => setText(r)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-2 hover:bg-surface-3">
                        <Clock className="h-4 w-4 text-ink-3" /> {r}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl bg-gradient-to-r from-pink-50 via-fuchsia-50 to-violet-50 p-3 text-xs text-violet-800 dark:from-pink-950/30 dark:to-violet-950/30 dark:text-violet-200">
                  <Sparkles className="mr-1 inline h-4 w-4 text-brand-pink" />
                  ¿Quieres que la IA redacte una clase? Escribe <b>“Diseñar sesión de…”</b>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-ink-3">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function ResultRow({ icon, title, meta, onClick }: { icon: React.ReactNode; title: string; meta?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-surface-3">
      {icon}
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{title}</span>
      {meta && <span className="truncate text-xs text-ink-3">{meta}</span>}
    </button>
  )
}
