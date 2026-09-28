export const RESOURCES = [
  { name: 'system-user', description: 'Gestión de usuarios del sistema' },
  { name: 'ai-analysis', description: 'Análisis y trazabilidad de IA' },
  { name: 'notification', description: 'Notificaciones internas' },
  { name: 'rag', description: 'Búsqueda vectorial y de texto (RAG)' },
  { name: 'system-log', description: 'Auditoría de cambios en entidades' },
  { name: 'auth', description: 'Autenticación y sesiones' },
  { name: 'module', description: 'Visibilidad de módulos del frontend' },
  { name: 'custom-module', description: 'Módulos personalizados del usuario' },
] as const;

export type ResourceName = (typeof RESOURCES)[number]['name'];

export const PERMISSIONS = [
  {
    name: 'system-user:read',
    resource: 'system-user',
    description: 'Ver usuarios',
  },
  {
    name: 'system-user:create',
    resource: 'system-user',
    description: 'Crear usuarios',
  },
  {
    name: 'system-user:update',
    resource: 'system-user',
    description: 'Editar usuarios',
  },
  {
    name: 'system-user:delete',
    resource: 'system-user',
    description: 'Eliminar usuarios',
  },
  {
    name: 'ai-analysis:read',
    resource: 'ai-analysis',
    description: 'Ver análisis de IA',
  },
  {
    name: 'ai-analysis:create',
    resource: 'ai-analysis',
    description: 'Ejecutar análisis de IA',
  },
  {
    name: 'notification:read',
    resource: 'notification',
    description: 'Ver notificaciones',
  },
  {
    name: 'notification:update',
    resource: 'notification',
    description: 'Marcar/editar notificaciones',
  },
  { name: 'rag:read', resource: 'rag', description: 'Listar documentos RAG' },
  {
    name: 'rag:search',
    resource: 'rag',
    description: 'Buscar en el índice RAG',
  },
  {
    name: 'rag:upload-view',
    resource: 'rag',
    description: 'Ver la sección de subida de documentos RAG',
  },
  {
    name: 'rag:upload',
    resource: 'rag',
    description: 'Subir documentos al índice RAG',
  },
  {
    name: 'system-log:read',
    resource: 'system-log',
    description: 'Ver auditoría',
  },
  {
    name: 'module:records',
    resource: 'module',
    description: 'Ver módulo Records View (RAG)',
  },
  {
    name: 'module:coaching',
    resource: 'module',
    description: 'Ver módulo Coaching Forms',
  },
  {
    name: 'module:vacations',
    resource: 'module',
    description: 'Ver módulo Vacations',
  },
  {
    name: 'module:sales',
    resource: 'module',
    description: 'Ver módulo Sales',
  },
  {
    name: 'module:licenses',
    resource: 'module',
    description: 'Ver módulo Licenses',
  },
  {
    name: 'module:permissions',
    resource: 'module',
    description: 'Ver módulo Permissions',
  },
  {
    name: 'custom-module:read',
    resource: 'custom-module',
    description: 'Ver módulos personalizados',
  },
  {
    name: 'custom-module:create',
    resource: 'custom-module',
    description: 'Crear módulos personalizados',
  },
  {
    name: 'custom-module:update',
    resource: 'custom-module',
    description: 'Editar módulos personalizados',
  },
  {
    name: 'custom-module:delete',
    resource: 'custom-module',
    description: 'Eliminar módulos personalizados',
  },
] as const satisfies ReadonlyArray<{
  name: string;
  resource: ResourceName;
  description: string;
}>;

export type PermissionName = (typeof PERMISSIONS)[number]['name'];
