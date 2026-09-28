// ──────────────────────────────────────────────
// Icon — resuelve un icono de lucide por nombre.
// El contenido de la academia declara sus iconos
// como texto ("BookOpen"), así que el catálogo de
// cursos puede venir de la API sin importar
// componentes.
// ──────────────────────────────────────────────

import * as LucideIcons from 'lucide-react'
import { Circle, type LucideProps } from 'lucide-react'

export interface IconProps extends LucideProps {
  /** Nombre del icono en PascalCase, tal como lo exporta lucide-react. */
  name: string
}

export default function Icon({ name, ...props }: IconProps) {
  const catalog = LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>
  const Component = catalog[name] ?? Circle
  return <Component {...props} />
}
