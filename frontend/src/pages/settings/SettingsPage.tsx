import { useSearchParams } from 'react-router-dom'
import { CalendarCog, Palette, UserRound, Users } from 'lucide-react'
import { PageHeader, Tabs } from '@components/ui'
import { ProfileTab } from './ProfileTab'
import { SchoolYearTab } from './SchoolYearTab'
import { SectionsTab } from './SectionsTab'
import { PreferencesTab } from './PreferencesTab'

type Tab = 'perfil' | 'anio' | 'secciones' | 'preferencias'

export default function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'perfil'
  return (
    <div>
      <PageHeader title="Ajustes" subtitle="Configuración de tu cuenta, del año escolar y de la interfaz" />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={(t) => setParams({ tab: t })}
        items={[
          { key: 'perfil', label: 'Mi perfil y firma', icon: <UserRound className="h-4 w-4" /> },
          { key: 'anio', label: 'Año escolar', icon: <CalendarCog className="h-4 w-4" /> },
          { key: 'secciones', label: 'Secciones y horario', icon: <Users className="h-4 w-4" /> },
          { key: 'preferencias', label: 'Preferencias', icon: <Palette className="h-4 w-4" /> },
        ]}
      />
      {tab === 'perfil' && <ProfileTab />}
      {tab === 'anio' && <SchoolYearTab welcome={params.get('bienvenida') === '1'} autoCreate={params.get('nuevo') === '1'} />}
      {tab === 'secciones' && <SectionsTab />}
      {tab === 'preferencias' && <PreferencesTab />}
    </div>
  )
}
