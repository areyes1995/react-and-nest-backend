import { Link } from 'react-router-dom'
import { Rocket } from 'lucide-react'

export function SetupBanner({ hasYear }: { hasYear: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-amber-200 bg-soft-yellow p-4 dark:border-amber-900/50">
      <Rocket className="h-6 w-6 text-amber-500" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{hasYear ? 'Agrega tus secciones' : 'Configura tu año escolar'}</p>
        <p className="text-xs text-ink-2">
          {hasYear
            ? 'Registra tus cursos, su horario y tus estudiantes para activar el panel.'
            : 'Define las semanas lectivas, los periodos y los feriados; luego crea tus secciones.'}
        </p>
      </div>
      <Link to={hasYear ? '/app/ajustes?tab=secciones' : '/app/ajustes?tab=anio'} className="btn btn-primary btn-sm">
        {hasYear ? 'Crear secciones' : 'Crear año escolar'}
      </Link>
    </div>
  )
}
