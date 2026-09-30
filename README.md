# Educraft XYZ

Plataforma integral para docentes de Matemática del Nivel Secundario (República Dominicana). Reúne en una sola aplicación la planificación alineada a la **Adecuación Curricular de Matemática (MINERD)**, la creación de clases, la evaluación, el seguimiento del estudiante, los reportes y la inteligencia artificial pedagógica.

La documentación de origen está en `.docs/documentacion/` (especificación de interfaz, funciones, prompt maestro, adecuación curricular y plantillas oficiales).

## Módulos

| Módulo | Qué incluye |
| --- | --- |
| Inicio | Panel del diseño de referencia: accesos rápidos (nueva sesión, crear evaluación, planificador, asistencia, notas, recursos, IA), clases de hoy con aula virtual de proyección, resumen con radar de competencias, calendario, widget IA y alertas |
| Planificación | Año escolar (semanas lectivas, 4 periodos, feriados RD), planificador anual / por periodo / mensual / semanal / diario con arrastrar y soltar, programaciones (anual, unidades, experiencias, proyectos), plan de clase con la plantilla oficial, exportación Word/PDF |
| Clases | Presentaciones con bloques reutilizables (plantilla oficial de 11 diapositivas), proyección y exportación a PowerPoint; actividades interactivas (quiz con tiempo, V/F, relacionar, completar, ordenar pasos, ruleta, memorama, escape room, plano cartesiano, clasificar) |
| Herramientas | Calculadora científica con historial, graficadora 2D (varias funciones, zoom, derivadas, integrales, límites, intersecciones), conversor de unidades, editor LaTeX |
| IA Educraft | Generador de problemas con variantes, generador de sesiones, ejemplos paso a paso, tutor virtual, rúbricas, listas de cotejo, exámenes, actividades, observaciones, estrategias de refuerzo y programación anual |
| Evaluación | Exámenes con versiones y clave, banco de preguntas, corrección automática de preguntas objetivas, rúbricas, listas de cotejo, escalas de valoración y calificación de actividades con instrumentos |
| Estudiantes | Registro e importación desde Excel, pase de lista P/T/F/J, registro oficial de calificaciones (P/RP, PC1–PC4, C.F., completiva, extraordinaria y especial) con importación/exportación de la plantilla, expediente digital |
| Seguimiento | Alertas de promedio bajo, bajo rendimiento sostenido, inasistencias y entregas pendientes, con estrategias de refuerzo generadas con IA |
| Reportes | Rendimiento, asistencia, competencias, conducta, boletín MINERD y reporte para padres con enlace seguro de solo lectura |
| Calendario, Recursos y Ajustes | Agenda unificada con exportación `.ics`, biblioteca con carga masiva y etiquetas, perfil con firma digital, secciones y horario |

## Arquitectura

- `backend/`: NestJS 11, Prisma 7 y PostgreSQL (pgvector). JWT con RBAC; el rol **DOCENTE** ve solo sus propios datos. Los módulos académicos están en `backend/src/modules/educraft/` y toda escritura queda auditada en `SystemLog`.
- `frontend/`: React 19, Vite y Tailwind, con el sistema de diseño pastel del diseño de referencia (tema claro y oscuro).
- IA: se usa un proveedor compatible con OpenAI si se configuran `OPENAI_API_URL` (URL completa de `/chat/completions`) y `OPENAI_API_KEY`. Si no hay proveedor, o si falla, la plataforma usa generadores deterministas que siguen las plantillas oficiales, así que funciona siempre. El solucionador paso a paso (ecuaciones lineales, cuadráticas, sistemas 2×2) es exacto y no depende de IA.

## Puesta en marcha

```bash
pnpm install
cp backend/.env.example backend/.env        # ajusta DATABASE_URL, SECRET_PASSPORT…
pnpm db:migrate                              # aplica migraciones
pnpm db:seed                                 # roles + currículo de Matemática
pnpm db:seed:demo                            # opcional: docente de demostración
pnpm dev                                     # API :3000 · web :5173
```

Docente de demostración: `docente@educraft.app` / `Educraft2025!`. Los docentes nuevos se registran en `/registro`.

Pruebas: `pnpm --filter starter-backend test` y `pnpm --filter @starter/frontend test`.

## Notas

- La migración `20261001000000_educraft_academic` es aditiva. Las tablas heredadas del proyecto anterior (`Academy*`, `QuizQuestion`, `SavedItem`, `Subscription`) no se eliminan; si no se usan, pueden borrarse con una migración aparte.
- Mensajería entre docentes y sincronización directa con la API de Google Calendar quedan pendientes. La agenda se exporta en `.ics`, que Google Calendar importa.
- El frontend es React y no Flutter como propone el prompt maestro: se mantuvo el stack existente del repositorio.
