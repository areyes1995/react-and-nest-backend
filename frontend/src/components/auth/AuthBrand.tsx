// ──────────────────────────────────────────────
// AuthBrand — la marca en las pantallas de acceso.
// Login, recuperar, restablecer y verificar abren
// con el mismo logo; tenerlo en un sitio evita que
// las cuatro se desincronicen.
//
// El dibujo sale de BrandMark, el mismo componente
// que usa la barra lateral del dashboard: quien
// entra ve la marca que va a encontrar dentro.
// ──────────────────────────────────────────────

import BrandMark from '@components/brand/BrandMark'
import { useAppTranslation } from '@i18n/useAppTranslation'

interface AuthBrandProps {
  /** Lado del cuadro del logo, en píxeles. */
  size?: number
  /** Muestra el nombre de la academia bajo el logo. */
  showName?: boolean
}

export default function AuthBrand({ size = 48, showName = true }: AuthBrandProps) {
  const { t } = useAppTranslation()

  return (
    <div className="flex flex-col items-center gap-2.5">
      <BrandMark size={size} />
      {showName && (
        <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
          {t('app.name')}
        </span>
      )}
    </div>
  )
}
