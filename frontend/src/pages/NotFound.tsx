import { Link } from 'react-router-dom'
import { LogoMark } from '@components/brand/Logo'

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center p-6 text-center">
      <div>
        <LogoMark size={64} className="mx-auto" />
        <h1 className="mt-4 text-3xl font-extrabold">Página no encontrada</h1>
        <p className="mt-2 text-sm text-ink-3">La dirección que buscas no existe o fue movida.</p>
        <Link to="/app/inicio" className="btn btn-primary mt-5">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
