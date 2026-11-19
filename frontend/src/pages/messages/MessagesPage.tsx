import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCheck,
  MessageCircle,
  Paperclip,
  Plus,
  Send,
  Share2,
} from 'lucide-react'
import { useFeedback } from '@context/ToastContext'
import {
  messagingApi,
  type ConversationSummary,
  type MessagingMessage,
  type SharedResourceType,
} from '@services/educraft'
import { useAsync } from '@hooks/useAsync'
import { relativeTime } from '@lib/format'
import { cn } from '@lib/cn'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  PageHeader,
  Spinner,
  Textarea,
} from '@components/ui'

const RESOURCE_TYPES: Array<{ value: SharedResourceType; label: string }> = [
  { value: 'LIBRARY', label: 'Recurso de biblioteca' },
  { value: 'LESSON_PLAN', label: 'Plan de clase' },
  { value: 'LEARNING_UNIT', label: 'Programación / unidad' },
]

export default function MessagesPage() {
  const { success, error } = useFeedback()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'shared' ? 'shared' : 'conversations'
  const selectedId = Number(params.get('c')) || null
  const [draft, setDraft] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const conversations = useAsync(() => messagingApi.conversations(), [])
  const candidates = useAsync(() => messagingApi.candidates(), [])
  const shared = useAsync(() => messagingApi.shared(), [tab], tab === 'shared')
  const thread = useAsync(
    () => (selectedId ? messagingApi.messages(selectedId) : Promise.resolve([])),
    [selectedId],
  )

  const setTab = (value: 'conversations' | 'shared') => {
    const next = new URLSearchParams(params)
    if (value === 'shared') next.set('tab', 'shared')
    else next.delete('tab')
    setParams(next, { replace: true })
  }

  const select = (id: number) => {
    const next = new URLSearchParams(params)
    next.set('c', String(id))
    setParams(next, { replace: true })
  }

  useEffect(() => {
    if (!selectedId) return
    void messagingApi.markRead(selectedId).then(() => conversations.reload()).catch(() => undefined)
  }, [selectedId, conversations.reload])

  useEffect(() => {
    if (params.get('compose') === '1') {
      setComposeOpen(true)
      const next = new URLSearchParams(params)
      next.delete('compose')
      setParams(next, { replace: true })
    }
  }, [params, setParams])

  const selected: ConversationSummary | undefined = conversations.data?.find((c) => c.id === selectedId)
  const items = conversations.data ?? []

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedId || !draft.trim()) return
    try {
      await messagingApi.send(selectedId, draft.trim())
      setDraft('')
      await Promise.all([thread.reload(), conversations.reload()])
    } catch (err) {
      error('No se pudo enviar el mensaje', (err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Mensajes"
        subtitle="Colabora con otros docentes y comparte planificaciones y recursos"
        icon={<MessageCircle className="h-7 w-7 text-brand-purple" />}
        actions={
          <>
            <Button
              variant={tab === 'shared' ? 'primary' : 'secondary'}
              icon={<Share2 className="h-4 w-4" />}
              onClick={() => setTab(tab === 'shared' ? 'conversations' : 'shared')}
            >
              {tab === 'shared' ? 'Ver conversaciones' : 'Elementos compartidos'}
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setComposeOpen(true)}>
              Nueva conversación
            </Button>
          </>
        }
      />

      {tab === 'shared' ? (
        <SharedPanel state={shared} onOpen={(id) => { select(id); void messagingApi.markRead(id); setTab('conversations') }} />
      ) : (
        <div className="grid min-h-[32rem] gap-4 md:grid-cols-[19rem_minmax(0,1fr)]">
          <section className={cn('card overflow-hidden', selected && 'hidden md:block')} aria-label="Conversaciones">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-bold text-ink">Conversaciones</h2>
              <Badge tone="purple">{items.length}</Badge>
            </div>
            {conversations.loading && !conversations.data ? (
              <Spinner label="Cargando conversaciones…" />
            ) : conversations.error ? (
              <ErrorState message={conversations.error} onRetry={() => void conversations.reload()} />
            ) : items.length === 0 ? (
              <EmptyState
                icon={<MessageCircle className="h-6 w-6" />}
                title="Sin conversaciones todavía"
                description="Inicia una conversación con un colega para coordinar clases y compartir recursos."
                action={<Button size="sm" onClick={() => setComposeOpen(true)}>Escribir a un docente</Button>}
              />
            ) : (
              <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
                {items.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      onClick={() => select(conversation.id)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-surface-2',
                        selectedId === conversation.id && 'bg-soft-purple',
                      )}
                    >
                      <Avatar name={conversation.participants.map((p) => p.name).join(' ') || 'Docente'} size={38} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-ink">
                            {conversation.title || conversation.participants.map((p) => p.name).join(', ') || 'Conversación'}
                          </p>
                          <span className="ml-auto shrink-0 text-[0.68rem] text-ink-3">{relativeTime(conversation.updatedAt)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-3">
                          {conversation.lastMessage?.content ?? 'Aún sin mensajes'}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && <Badge tone="pink">{conversation.unreadCount}</Badge>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={cn('card flex min-h-[32rem] min-w-0 flex-col overflow-hidden', !selected && 'hidden md:flex')} aria-label="Hilo de mensajes">
            {!selected ? (
              <EmptyState
                icon={<MessageCircle className="h-6 w-6" />}
                title="Selecciona una conversación"
                description="Aquí verás el hilo y podrás compartir recursos con tus colegas."
              />
            ) : (
              <>
                <header className="flex items-center gap-3 border-b border-line px-4 py-3">
                  <button className="icon-btn md:hidden" onClick={() => { const next = new URLSearchParams(params); next.delete('c'); setParams(next, { replace: true }) }} aria-label="Volver a conversaciones">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <Avatar name={selected.participants.map((p) => p.name).join(' ') || 'Docente'} size={38} />
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-ink">
                      {selected.title || selected.participants.map((p) => p.name).join(', ')}
                    </h2>
                    <p className="truncate text-xs text-ink-3">{selected.participants.map((p) => p.name).join(' · ')}</p>
                  </div>
                  <Button className="ml-auto shrink-0" size="sm" variant="secondary" icon={<Paperclip className="h-4 w-4" />} onClick={() => setShareOpen(true)}>
                    Compartir
                  </Button>
                </header>

                <div className="scroll-area max-h-[52vh] flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
                  {thread.loading && !thread.data ? (
                    <Spinner label="Cargando mensajes…" />
                  ) : thread.error ? (
                    <ErrorState message={thread.error} onRetry={() => void thread.reload()} />
                  ) : !thread.data?.length ? (
                    <p className="py-8 text-center text-xs text-ink-3">Sé la primera persona en escribir en este hilo.</p>
                  ) : (
                    thread.data.map((message) => <MessageBubble key={message.id} message={message} />)
                  )}
                </div>

                <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3">
                  <label htmlFor="mensaje-nuevo" className="sr-only">Escribe un mensaje</label>
                  <Textarea
                    id="mensaje-nuevo"
                    rows={2}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Escribe un mensaje para tus colegas…"
                    className="min-w-0 flex-1"
                  />
                  <Button type="submit" disabled={!draft.trim()} icon={<Send className="h-4 w-4" />}>
                    Enviar
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      <NewConversationModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        candidates={candidates.data ?? []}
        loading={candidates.loading}
        onCreated={(conversation) => {
          setComposeOpen(false)
          void conversations.reload()
          select(conversation.id)
          success('Conversación creada', 'Ya puedes escribir y compartir recursos.')
        }}
      />

      <ShareModal
        open={shareOpen}
        conversation={selected ?? null}
        onClose={() => setShareOpen(false)}
        onShared={async () => {
          await Promise.all([thread.reload(), conversations.reload(), shared.reload()])
          success('Recurso compartido', 'El enlace quedó disponible en la conversación.')
        }}
      />
    </div>
  )
}

function MessageBubble({ message }: { message: MessagingMessage }) {
  return (
    <article className={cn('flex gap-2', message.isMine && 'flex-row-reverse')}>
      <Avatar name={message.senderName} size={32} />
      <div className={cn('max-w-[85%] min-w-0 rounded-2xl border border-line px-3 py-2', message.isMine ? 'bg-soft-purple' : 'bg-surface-2')}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-ink">{message.isMine ? 'Tú' : message.senderName}</span>
          <time className="text-[0.68rem] text-ink-3" dateTime={message.createdAt}>{relativeTime(message.createdAt)}</time>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink-2 [overflow-wrap:anywhere]">{message.content}</p>
        {message.sharedResource && (
          <a href={message.sharedResource.url} className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-brand-purple hover:underline">
            <Share2 className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{message.sharedResource.title}</span>
          </a>
        )}
        {message.kind === 'SHARED_RESOURCE' && <Badge tone="blue" className="mt-2">Recurso compartido</Badge>}
      </div>
    </article>
  )
}

function SharedPanel({ state, onOpen }: { state: ReturnType<typeof useAsync<MessagingMessage[]>>; onOpen: (conversationId: number) => void }) {
  const items = state.data ?? []
  return (
    <section className="card overflow-hidden" aria-label="Elementos compartidos">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-bold text-ink">Elementos compartidos contigo</h2>
        <p className="mt-0.5 text-xs text-ink-3">Programaciones, planes de clase y recursos enviados por otros docentes.</p>
      </div>
      {state.loading && !state.data ? (
        <Spinner label="Cargando elementos compartidos…" />
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={() => void state.reload()} />
      ) : items.length === 0 ? (
        <EmptyState icon={<Share2 className="h-6 w-6" />} title="Nada compartido contigo aún" description="Los recursos que compartan tus colegas aparecerán aquí." />
      ) : (
        <ul className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((message) => (
            <li key={message.id} className="rounded-2xl border border-line p-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 shrink-0 text-brand-purple" />
                <p className="truncate text-sm font-semibold text-ink">{message.sharedResource?.title ?? message.content}</p>
              </div>
              <p className="mt-1 text-xs text-ink-3">Compartido por {message.senderName} · {relativeTime(message.createdAt)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {message.sharedResource && <Button size="sm" variant="secondary" onClick={() => window.open(message.sharedResource?.url, '_blank', 'noopener,noreferrer')}>Abrir recurso</Button>}
                <Button size="sm" variant="ghost" onClick={() => onOpen(message.conversationId)}>Ver conversación</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function NewConversationModal({
  open,
  onClose,
  candidates,
  loading,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  candidates: Array<{ id: number; name: string; email: string }>
  loading: boolean
  onCreated: (conversation: ConversationSummary) => void
}) {
  const { error } = useFeedback()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [invited, setInvited] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  const toggle = (id: number) => setInvited((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!invited.length) return
    setSaving(true)
    try {
      const conversation = await messagingApi.createConversation({ participantIds: invited, title: title.trim() || undefined, message: message.trim() || undefined })
      setTitle('')
      setMessage('')
      setInvited([])
      onCreated(conversation)
    } catch (err) {
      error('No se pudo crear la conversación', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva conversación"
      subtitle="Selecciona los docentes con los que quieres coordinar"
      size="md"
      footer={<Button type="submit" form="nueva-conversacion" loading={saving} disabled={!invited.length}>Crear conversación</Button>}
    >
      <form id="nueva-conversacion" onSubmit={submit} className="space-y-4">
        <Field label="Título (opcional)">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} placeholder="Ej.: Coordinación de matemática 3°" />
        </Field>
        <Field label="Docentes" hint={`${invited.length} seleccionado${invited.length === 1 ? '' : 's'}`}>
          <div className="scroll-area max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
            {loading && <Spinner />}
            {!loading && candidates.length === 0 && <p className="p-3 text-center text-xs text-ink-3">No hay docentes disponibles.</p>}
            {candidates.map((candidate) => (
              <label key={candidate.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm text-ink-2 hover:bg-surface-2">
                <input type="checkbox" checked={invited.includes(candidate.id)} onChange={() => toggle(candidate.id)} className="h-4 w-4 accent-violet-600" />
                <span className="min-w-0"><span className="block truncate font-semibold">{candidate.name}</span><span className="block truncate text-xs text-ink-3">{candidate.email}</span></span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Primer mensaje (opcional)">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} placeholder="Escribe un saludo o el motivo de la conversación…" />
        </Field>
      </form>
    </Modal>
  )
}

function ShareModal({
  open,
  conversation,
  onClose,
  onShared,
}: {
  open: boolean
  conversation: ConversationSummary | null
  onClose: () => void
  onShared: () => Promise<void>
}) {
  const { error } = useFeedback()
  const [type, setType] = useState<SharedResourceType>('LIBRARY')
  const [resourceId, setResourceId] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!conversation || !resourceId) return
    setSaving(true)
    try {
      await messagingApi.share(conversation.id, {
        sharedResource: { type, id: Number(resourceId) },
        note: note.trim() || undefined,
      })
      setResourceId('')
      setNote('')
      onClose()
      await onShared()
    } catch (err) {
      error('No se pudo compartir el recurso', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Compartir un recurso" subtitle="Comparte un elemento de tu biblioteca o planificación" size="sm" footer={<Button type="submit" form="compartir-recurso" loading={saving} disabled={!resourceId}>Compartir</Button>}>
      <form id="compartir-recurso" onSubmit={submit} className="space-y-4">
        <Field label="Tipo de recurso">
          <select className="input cursor-pointer" value={type} onChange={(e) => setType(e.target.value as SharedResourceType)}>
            {RESOURCE_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        <Field label="Identificador del recurso" hint="Lo encuentras en la URL del recurso en tu biblioteca o planificación.">
          <Input type="number" min={1} required value={resourceId} onChange={(e) => setResourceId(e.target.value)} placeholder="Ej.: 12" />
        </Field>
        <Field label="Nota (opcional)">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} placeholder="Añade una indicación para tus colegas…" />
        </Field>
        <p className="flex items-center gap-2 text-xs text-ink-3"><CheckCheck className="h-4 w-4 shrink-0 text-emerald-500" /> Solo puedes compartir recursos creados por ti.</p>
      </form>
    </Modal>
  )
}
