// ──────────────────────────────────────────────
// FreeModeModal — el aviso de la mesa en modo gratis.
// La mesa de práctica se puede mirar sin suscripción,
// pero cualquier botón abre este aviso en vez de
// actuar.
// ──────────────────────────────────────────────

import { Link } from 'react-router-dom'
import { Crown, X } from 'lucide-react'
import Modal from '@components/ui/modal/Modal'

export interface FreeModeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FreeModeModal({ isOpen, onClose }: FreeModeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="relative p-6 text-center" role="dialog" aria-label="Estás en modo gratis">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--poker-gold)]/15 text-[var(--poker-gold)]">
          <Crown className="h-5 w-5" strokeWidth={2} />
        </span>
        <h2 className="mt-3 text-lg font-bold text-[var(--text-primary)]">Estás en modo gratis</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
          La mesa de práctica es solo de muestra en el plan gratis: puedes verla, pero no jugar ni cambiar
          su configuración. Suscríbete para desbloquearla junto con todos los cursos y herramientas.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to="/checkout/premium"
            className="press inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-[#1a1206]"
            style={{ background: 'linear-gradient(135deg, var(--poker-gold), #e09a2e)' }}
          >
            <Crown className="h-4 w-4" strokeWidth={2} />
            Suscribirme
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
          >
            Seguir mirando
          </button>
        </div>
      </div>
    </Modal>
  )
}
