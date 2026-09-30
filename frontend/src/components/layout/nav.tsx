import type { ReactNode } from 'react'
import {
  BarChart3,
  Bot,
  CalendarDays,
  ClipboardCheck,
  FolderOpen,
  Home,
  LayoutList,
  Presentation,
  Settings,
  ShieldCheck,
  Sigma,
  UserRoundCheck,
  Users,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  description: string
  permission?: string
  adminOnly?: boolean
  end?: boolean
}

const icon = 'h-[1.05rem] w-[1.05rem]'

export const NAV_ITEMS: NavItem[] = [
  { to: '/app/inicio', label: 'Inicio', icon: <Home className={icon} />, description: 'Tu panel del día', end: true },
  { to: '/app/planificacion', label: 'Planificación', icon: <LayoutList className={icon} />, description: 'Planificador inteligente y programaciones', permission: 'planning:manage' },
  { to: '/app/clases', label: 'Clases', icon: <Presentation className={icon} />, description: 'Presentaciones y actividades interactivas', permission: 'planning:manage' },
  { to: '/app/herramientas', label: 'Herramientas', icon: <Sigma className={icon} />, description: 'Laboratorio matemático', },
  { to: '/app/ia', label: 'IA Educraft', icon: <Bot className={icon} />, description: 'Generadores y tutor virtual', permission: 'ai-pedagogy:use' },
  { to: '/app/evaluacion', label: 'Evaluación', icon: <ClipboardCheck className={icon} />, description: 'Exámenes, rúbricas y listas de cotejo', permission: 'evaluation:manage' },
  { to: '/app/estudiantes', label: 'Estudiantes', icon: <Users className={icon} />, description: 'Listado, asistencia y calificaciones', permission: 'academic:manage' },
  { to: '/app/seguimiento', label: 'Seguimiento', icon: <UserRoundCheck className={icon} />, description: 'Alertas y acompañamiento', permission: 'report:manage' },
  { to: '/app/recursos', label: 'Recursos', icon: <FolderOpen className={icon} />, description: 'Biblioteca de recursos', permission: 'library:manage' },
  { to: '/app/calendario', label: 'Calendario', icon: <CalendarDays className={icon} />, description: 'Agenda académica', permission: 'planning:manage' },
  { to: '/app/reportes', label: 'Reportes', icon: <BarChart3 className={icon} />, description: 'Informes, boletines y reportes para padres', permission: 'report:manage' },
  { to: '/app/ajustes', label: 'Ajustes', icon: <Settings className={icon} />, description: 'Perfil, año escolar y preferencias' },
  { to: '/app/admin', label: 'Administración', icon: <ShieldCheck className={icon} />, description: 'Usuarios y roles', adminOnly: true },
]
