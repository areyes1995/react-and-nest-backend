export const RESOURCES = [
  { name: 'system-user', description: 'Gestión de usuarios del sistema' },
  { name: 'ai-analysis', description: 'Análisis y trazabilidad de IA' },
  { name: 'notification', description: 'Notificaciones internas' },
  { name: 'rag', description: 'Búsqueda vectorial y de texto (RAG)' },
  { name: 'system-log', description: 'Auditoría de cambios en entidades' },
  { name: 'auth', description: 'Autenticación y sesiones' },
  { name: 'module', description: 'Visibilidad de módulos del frontend' },
  { name: 'custom-module', description: 'Módulos personalizados del usuario' },
  { name: 'curriculum', description: 'Adecuación curricular (competencias, indicadores, contenidos)' },
  { name: 'academic', description: 'Año escolar, secciones, estudiantes, asistencia y calificaciones' },
  { name: 'planning', description: 'Programaciones, planes de clase, presentaciones y actividades' },
  { name: 'evaluation', description: 'Banco de preguntas, exámenes, rúbricas y listas de cotejo' },
  { name: 'library', description: 'Biblioteca de recursos del docente' },
  { name: 'report', description: 'Reportes, boletines e informes para padres' },
  { name: 'ai-pedagogy', description: 'Inteligencia artificial pedagógica' },
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
    name: 'module:users',
    resource: 'module',
    description: 'Ver módulo de usuarios',
  },
  {
    name: 'module:roles',
    resource: 'module',
    description: 'Ver módulo de roles y permisos',
  },
  {
    name: 'module:dashboard',
    resource: 'module',
    description: 'Ver dashboard principal',
  },
  {
    name: 'module:permissions',
    resource: 'module',
    description: 'Ver administración',
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
  {
    name: 'curriculum:read',
    resource: 'curriculum',
    description: 'Consultar la adecuación curricular',
  },
  {
    name: 'curriculum:manage',
    resource: 'curriculum',
    description: 'Editar el catálogo curricular',
  },
  {
    name: 'academic:manage',
    resource: 'academic',
    description: 'Gestionar año escolar, secciones, estudiantes, asistencia y notas',
  },
  {
    name: 'planning:manage',
    resource: 'planning',
    description: 'Gestionar planificación, clases y presentaciones',
  },
  {
    name: 'evaluation:manage',
    resource: 'evaluation',
    description: 'Gestionar evaluaciones e instrumentos',
  },
  {
    name: 'library:manage',
    resource: 'library',
    description: 'Gestionar la biblioteca de recursos',
  },
  {
    name: 'report:manage',
    resource: 'report',
    description: 'Generar reportes, boletines e informes para padres',
  },
  {
    name: 'ai-pedagogy:use',
    resource: 'ai-pedagogy',
    description: 'Usar los generadores y el tutor de IA',
  },
  {
    name: 'module:educraft',
    resource: 'module',
    description: 'Ver el espacio docente de Educraft',
  },
] as const satisfies ReadonlyArray<{
  name: string;
  resource: ResourceName;
  description: string;
}>;

export type PermissionName = (typeof PERMISSIONS)[number]['name'];
