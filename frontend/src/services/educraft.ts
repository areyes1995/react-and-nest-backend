// ──────────────────────────────────────────────
// Cliente de la API académica de Educraft XYZ.
// Cada función lanza un Error con el mensaje del
// backend si la petición falla.
// ──────────────────────────────────────────────

import { del, get, getBlob, patch, post, put, upload, type ApiResponse } from './api'
import type {
  AcademicPeriod,
  ActivityType,
  AgendaItem,
  Alert,
  Assessment,
  AssessmentDetail,
  AttendanceRoster,
  AttendanceStats,
  AttendanceStatus,
  Bulletin,
  CalendarEventDetail,
  CalendarEventType,
  CompetenceDetail,
  CurriculumGrade,
  Dashboard,
  Difficulty,
  EvaluationInstrument,
  EvaluationType,
  Evidence,
  Exam,
  ExamVersions,
  FinalEntry,
  FundamentalCompetence,
  GeneratedProblem,
  GradeCurriculum,
  GradeRegister,
  InstrumentType,
  InteractiveActivity,
  LearningUnit,
  LessonPlan,
  LessonPlanInput,
  LibraryResource,
  Notification,
  Observation,
  ObservationType,
  ParentReport,
  Presentation,
  Question,
  QuestionType,
  ReportLink,
  ResourceCategory,
  SchoolYear,
  SearchResults,
  Section,
  SectionPerformance,
  Slide,
  StepSolution,
  Student,
  StudentRecord,
  TeacherProfile,
  TutorMessage,
  AiSource,
  ClassSchedule,
  UnitKind,
} from './types'

type Params = Record<string, string | number | boolean | undefined>

async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const res = await promise
  if (!res.ok) throw new Error(res.error || 'No se pudo completar la operación')
  return res.data
}

const q = <T>(path: string, params?: Params) => unwrap(get<T>(path, params))
const create = <T>(path: string, body?: unknown) => unwrap(post<T>(path, body))
const update = <T>(path: string, body?: unknown) => unwrap(put<T>(path, body))
const remove = (path: string) => unwrap(del<void>(path))

// ── Docente ───────────────────────────────────

export const teacherApi = {
  profile: () => q<TeacherProfile>('/teacher/profile'),
  updateProfile: (body: Partial<TeacherProfile['teacherProfile']> & { firstName?: string; lastName?: string; phoneNumber?: string }) =>
    update<TeacherProfile>('/teacher/profile', body),
  dashboard: (period?: number) => q<Dashboard>('/teacher/dashboard', { period }),
  search: (q_: string, scope?: string) => q<SearchResults>('/teacher/search', { q: q_, scope }),
}

// ── Currículo ─────────────────────────────────

export const curriculumApi = {
  grades: () => q<CurriculumGrade[]>('/curriculum/grades'),
  fundamentals: () => q<FundamentalCompetence[]>('/curriculum/fundamentals'),
  grade: (id: number) => q<GradeCurriculum>(`/curriculum/grades/${id}`),
}

// ── Año escolar ───────────────────────────────

export interface SchoolYearInput {
  name: string
  startDate: string
  endDate: string
  teachingWeeks?: number
  gradingScale?: { type: string; passing: number }
  periods?: Array<Pick<AcademicPeriod, 'number' | 'name' | 'startDate' | 'endDate'>>
  includeNationalHolidays?: boolean
  isActive?: boolean
}

export const schoolYearApi = {
  list: () => q<SchoolYear[]>('/school-years'),
  get: (id: number) => q<SchoolYear>(`/school-years/${id}`),
  create: (body: SchoolYearInput) => create<SchoolYear>('/school-years', body),
  update: (id: number, body: Partial<SchoolYearInput>) => update<SchoolYear>(`/school-years/${id}`, body),
  remove: (id: number) => remove(`/school-years/${id}`),
  addHoliday: (id: number, body: { name: string; date: string; isNational?: boolean }) =>
    create(`/school-years/${id}/holidays`, body),
  removeHoliday: (holidayId: number) => remove(`/school-years/holidays/${holidayId}`),
}

// ── Secciones y estudiantes ───────────────────

export interface SectionInput {
  schoolYearId: number
  gradeId: number
  name: string
  subject?: string
  color?: string
  room?: string
  schedules?: ClassSchedule[]
}

export type StudentInput = Partial<Omit<Student, 'id' | 'section' | 'sectionId'>> & { firstName: string; lastName: string }

export const sectionApi = {
  list: (schoolYearId?: number) => q<Section[]>('/sections', { schoolYearId }),
  get: (id: number) => q<Section>(`/sections/${id}`),
  create: (body: SectionInput) => create<Section>('/sections', body),
  update: (id: number, body: Partial<SectionInput>) => update<Section>(`/sections/${id}`, body),
  remove: (id: number) => remove(`/sections/${id}`),
  addStudent: (sectionId: number, body: StudentInput) => create<Student>(`/sections/${sectionId}/students`, body),
  importStudents: (sectionId: number, students: StudentInput[]) =>
    create<{ imported: number; skipped: number }>(`/sections/${sectionId}/students/import`, { students }),
}

export const studentApi = {
  list: (params: { sectionId?: number; q?: string } = {}) => q<Student[]>('/students', params),
  update: (id: number, body: Partial<StudentInput> & { sectionId?: number; isActive?: boolean }) =>
    update<Student>(`/students/${id}`, body),
  remove: (id: number) => remove(`/students/${id}`),
  record: (id: number) => q<StudentRecord>(`/students/${id}/record`),
  addObservation: (id: number, body: { type: ObservationType; content: string; date?: string; aiGenerated?: boolean }) =>
    create<Observation>(`/students/${id}/observations`, body),
  removeObservation: (observationId: number) => remove(`/students/observations/${observationId}`),
  addEvidence: (id: number, data: { title: string; description?: string; url?: string; assessmentId?: number; file?: File }) => {
    const form = new FormData()
    form.set('title', data.title)
    if (data.description) form.set('description', data.description)
    if (data.url) form.set('url', data.url)
    if (data.assessmentId) form.set('assessmentId', String(data.assessmentId))
    if (data.file) form.set('file', data.file)
    return upload<Evidence>(`/students/${id}/evidences`, form)
  },
  evidenceFile: (evidenceId: number) => getBlob(`/students/evidences/${evidenceId}/file`),
  removeEvidence: (evidenceId: number) => remove(`/students/evidences/${evidenceId}`),
}

// ── Asistencia ────────────────────────────────

export const attendanceApi = {
  roster: (sectionId: number, date?: string) => q<AttendanceRoster>('/attendance', { sectionId, date }),
  save: (body: { sectionId: number; date: string; entries: Array<{ studentId: number; status: AttendanceStatus; note?: string }> }) =>
    update<AttendanceStats>('/attendance', body),
  stats: (sectionId: number, from?: string, to?: string) => q<AttendanceStats>('/attendance/stats', { sectionId, from, to }),
}

// ── Calificaciones y actividades ──────────────

export interface AssessmentInput {
  sectionId: number
  title: string
  description?: string
  type?: EvaluationType
  period: number
  block: number
  fundamentalId?: number
  instrumentId?: number
  examId?: number
  date: string
  dueDate?: string
  maxScore?: number
  weight?: number
  requiresDelivery?: boolean
}

export const gradesApi = {
  register: (sectionId: number) => q<GradeRegister>(`/grades/sections/${sectionId}`),
  save: (sectionId: number, entries: Array<{ studentId: number; period: number; block: number; score?: number | null; recovery?: number | null }>) =>
    update<GradeRegister>(`/grades/sections/${sectionId}`, { entries }),
  saveFinals: (sectionId: number, entries: Array<{ studentId: number } & Partial<FinalEntry>>) =>
    update<GradeRegister>(`/grades/sections/${sectionId}/final`, { entries }),
  recalculate: (sectionId: number, period?: number, overwriteManual?: boolean) =>
    unwrap(post<{ updated: number }>(`/grades/sections/${sectionId}/recalculate?${new URLSearchParams({
      ...(period ? { period: String(period) } : {}),
      ...(overwriteManual ? { overwriteManual: 'true' } : {}),
    })}`)),
}

export const assessmentApi = {
  list: (params: { sectionId?: number; period?: number } = {}) => q<Assessment[]>('/assessments', params),
  get: (id: number) => q<AssessmentDetail>(`/assessments/${id}`),
  create: (body: AssessmentInput) => create<Assessment>('/assessments', body),
  update: (id: number, body: Partial<AssessmentInput>) => update<Assessment>(`/assessments/${id}`, body),
  remove: (id: number) => remove(`/assessments/${id}`),
  saveScores: (
    id: number,
    entries: Array<{ studentId: number; score?: number | null; delivered?: boolean; feedback?: string; instrumentData?: Record<string, unknown> }>,
  ) => update<AssessmentDetail>(`/assessments/${id}/scores`, { entries }),
}

// ── Planificación ─────────────────────────────

export interface UnitInput {
  gradeId: number
  schoolYearId?: number
  sectionId?: number
  kind?: UnitKind
  title: string
  description?: string
  startDate?: string
  endDate?: string
  order?: number
  color?: string
  specificCompetenceIds?: number[]
  indicatorIds?: number[]
  contentIds?: number[]
  evaluationCriteria?: string[]
  evidences?: string[]
  aiGenerated?: boolean
}

export const planningApi = {
  units: (params: { gradeId?: number; schoolYearId?: number } = {}) => q<LearningUnit[]>('/units', params),
  unit: (id: number) => q<LearningUnit>(`/units/${id}`),
  createUnit: (body: UnitInput) => create<LearningUnit>('/units', body),
  updateUnit: (id: number, body: Partial<UnitInput>) => update<LearningUnit>(`/units/${id}`, body),
  removeUnit: (id: number) => remove(`/units/${id}`),

  plans: (params: { sectionId?: number; unitId?: number; from?: string; to?: string; q?: string } = {}) =>
    q<LessonPlan[]>('/lesson-plans', params),
  plan: (id: number) => q<LessonPlan>(`/lesson-plans/${id}`),
  createPlan: (body: LessonPlanInput) => create<LessonPlan>('/lesson-plans', body),
  updatePlan: (id: number, body: Partial<LessonPlanInput>) => update<LessonPlan>(`/lesson-plans/${id}`, body),
  duplicatePlan: (id: number) => create<LessonPlan>(`/lesson-plans/${id}/duplicate`),
  removePlan: (id: number) => remove(`/lesson-plans/${id}`),
  planToPresentation: (id: number) => create<Presentation>(`/lesson-plans/${id}/presentation`),

  presentations: () => q<Presentation[]>('/presentations'),
  presentation: (id: number) => q<Presentation>(`/presentations/${id}`),
  createPresentation: (body: { title: string; subtitle?: string; lessonPlanId?: number; slides: Slide[] }) =>
    create<Presentation>('/presentations', body),
  updatePresentation: (id: number, body: Partial<{ title: string; subtitle: string; slides: Slide[]; theme: string }>) =>
    update<Presentation>(`/presentations/${id}`, body),
  removePresentation: (id: number) => remove(`/presentations/${id}`),

  activities: (type?: ActivityType) => q<InteractiveActivity[]>('/activities', { type }),
  activity: (id: number) => q<InteractiveActivity>(`/activities/${id}`),
  createActivity: (body: Omit<InteractiveActivity, 'id' | 'updatedAt' | 'grade' | 'aiGenerated'> & { aiGenerated?: boolean }) =>
    create<InteractiveActivity>('/activities', body),
  updateActivity: (id: number, body: Partial<InteractiveActivity>) => update<InteractiveActivity>(`/activities/${id}`, body),
  removeActivity: (id: number) => remove(`/activities/${id}`),
}

// ── Evaluación ────────────────────────────────

export interface QuestionInput {
  topic: string
  type: QuestionType
  statement: string
  options?: unknown
  answer?: unknown
  gradeId?: number | null
  fundamentalId?: number | null
  difficulty?: Difficulty
  solution?: string | null
  points?: number
  tags?: string[]
  aiGenerated?: boolean
}

export const evaluationApi = {
  questions: (params: { q?: string; type?: QuestionType; gradeId?: number; difficulty?: Difficulty } = {}) =>
    q<Question[]>('/questions', params),
  createQuestion: (body: QuestionInput) => create<Question>('/questions', body),
  createQuestions: (questions: QuestionInput[]) => create<Question[]>('/questions/bulk', { questions }),
  updateQuestion: (id: number, body: Partial<QuestionInput>) => update<Question>(`/questions/${id}`, body),
  removeQuestion: (id: number) => remove(`/questions/${id}`),

  exams: () => q<Exam[]>('/exams'),
  exam: (id: number) => q<Exam>(`/exams/${id}`),
  createExam: (body: Omit<Partial<Exam>, 'questions'> & { title: string; questions?: Array<{ questionId: number; points?: number }> }) =>
    create<Exam>('/exams', body),
  updateExam: (id: number, body: Omit<Partial<Exam>, 'questions'> & { questions?: Array<{ questionId: number; points?: number }> }) =>
    update<Exam>(`/exams/${id}`, body),
  removeExam: (id: number) => remove(`/exams/${id}`),
  randomExam: (body: { title: string; count: number; topic?: string; gradeId?: number; types?: QuestionType[]; difficulty?: Difficulty; versions?: number }) =>
    create<Exam>('/exams/random', body),
  versions: (id: number, count?: number) => q<ExamVersions>(`/exams/${id}/versions`, { count }),
  grade: (id: number, version: number, answers: Record<number, unknown>) =>
    create<{ score: number; objectivePoints: number; totalPoints: number; detail: Array<{ number: number; auto: boolean; correct?: boolean }> }>(`/exams/${id}/grade`, { version, answers }),

  instruments: (type?: InstrumentType) => q<EvaluationInstrument[]>('/instruments', { type }),
  instrument: (id: number) => q<EvaluationInstrument>(`/instruments/${id}`),
  createInstrument: (body: Omit<EvaluationInstrument, 'id' | 'updatedAt' | 'grade' | 'aiGenerated' | 'description' | 'gradeId' | 'fundamentalId'> & { description?: string; gradeId?: number | null; fundamentalId?: number | null; aiGenerated?: boolean }) =>
    create<EvaluationInstrument>('/instruments', body),
  updateInstrument: (id: number, body: Partial<EvaluationInstrument>) => update<EvaluationInstrument>(`/instruments/${id}`, body),
  removeInstrument: (id: number) => remove(`/instruments/${id}`),
}

// ── Calendario ────────────────────────────────

export interface EventInput {
  type: CalendarEventType
  title: string
  description?: string
  startAt: string
  endAt?: string
  allDay?: boolean
  sectionId?: number
  color?: string
}

export const calendarApi = {
  agenda: (from: string, to: string, classes = true) => q<AgendaItem[]>('/calendar', { from, to, classes }),
  event: (id: number) => q<CalendarEventDetail>(`/calendar/events/${id}`),
  create: (body: EventInput) => create('/calendar/events', body),
  update: (id: number, body: Partial<EventInput>) => update(`/calendar/events/${id}`, body),
  remove: (id: number) => remove(`/calendar/events/${id}`),
}

// ── Biblioteca ────────────────────────────────

export const libraryApi = {
  list: (params: { category?: ResourceCategory; q?: string; tag?: string } = {}) => q<LibraryResource[]>('/library', params),
  summary: () => q<Partial<Record<ResourceCategory, number>>>('/library/summary'),
  create: (data: { title: string; category: ResourceCategory; description?: string; tags?: string[]; url?: string; file?: File }) => {
    const form = new FormData()
    form.set('title', data.title)
    form.set('category', data.category)
    if (data.description) form.set('description', data.description)
    if (data.tags?.length) form.set('tags', data.tags.join(','))
    if (data.url) form.set('url', data.url)
    if (data.file) form.set('file', data.file)
    return upload<LibraryResource>('/library', form)
  },
  update: (id: number, body: Partial<Pick<LibraryResource, 'title' | 'description' | 'category' | 'tags' | 'url'>>) =>
    update<LibraryResource>(`/library/${id}`, body),
  remove: (id: number) => remove(`/library/${id}`),
  file: (id: number) => getBlob(`/library/${id}/file`),
}

// ── Reportes ──────────────────────────────────

export const reportApi = {
  performance: (sectionId: number, period?: number) =>
    q<SectionPerformance>(`/reports/sections/${sectionId}/performance`, { period }),
  competence: (sectionId: number, block: number, period?: number) =>
    q<CompetenceDetail>(`/reports/sections/${sectionId}/competences/${block}`, { period }),
  attendance: (sectionId: number, from?: string, to?: string) =>
    q<AttendanceStats>(`/reports/sections/${sectionId}/attendance`, { from, to }),
  conduct: (sectionId: number) =>
    q<{ byType: Record<ObservationType, number>; observations: Array<Observation & { student: Pick<Student, 'id' | 'firstName' | 'lastName'> }> }>(
      `/reports/sections/${sectionId}/conduct`,
    ),
  bulletin: (studentId: number) => q<Bulletin>(`/reports/students/${studentId}/bulletin`),
  parent: (studentId: number) => q<ParentReport>(`/reports/students/${studentId}/parent`),
  share: (studentId: number, days = 30) => create<ReportLink>(`/reports/students/${studentId}/share`, { days }),
  revoke: (linkId: number) => remove(`/reports/shares/${linkId}`),
  alerts: () => q<Alert[]>('/reports/alerts'),
  publicReport: (token: string) => q<ParentReport>(`/public/reports/${encodeURIComponent(token)}`),
}

// ── IA Educraft ───────────────────────────────

export interface LessonPlanRequest {
  gradeId: number
  topic: string
  sectionId?: number
  unitId?: number
  date?: string
  durationMinutes?: number
  specificCompetenceIds?: number[]
  indicatorIds?: number[]
  contentIds?: number[]
  strategies?: string[]
  context?: string
  save?: boolean
}

export const aiApi = {
  status: () => q<{ providerEnabled: boolean; model: string; problemFamilies: string[] }>('/ai/status'),
  lessonPlan: (body: LessonPlanRequest) =>
    create<{ source: AiSource; saved: boolean; plan: LessonPlan | LessonPlanInput }>('/ai/lesson-plan', body),
  documentToSession: (data: { gradeId: number; text?: string; durationMinutes?: number; file?: File }) => {
    if (!data.file) {
      return create<{ source: AiSource; saved: boolean; plan: LessonPlanInput }>('/ai/document-to-session', data)
    }
    const form = new FormData()
    form.set('gradeId', String(data.gradeId))
    if (data.durationMinutes) form.set('durationMinutes', String(data.durationMinutes))
    if (data.text) form.set('text', data.text)
    form.set('file', data.file)
    return upload<{ source: AiSource; saved: boolean; plan: LessonPlanInput }>('/ai/document-to-session', form)
  },
  problems: (body: { topic: string; gradeId?: number; fundamentalId?: number; context?: string; difficulty?: Difficulty; count?: number }) =>
    create<{ source: AiSource; topic: string; difficulty: Difficulty; problems: GeneratedProblem[] }>('/ai/problems', body),
  stepByStep: (expression: string) => create<StepSolution>('/ai/step-by-step', { expression }),
  rubric: (body: { topic: string; gradeId?: number; fundamentalId?: number; criteriaCount?: number; save?: boolean }) =>
    create<{ source: AiSource; saved: boolean; instrument: EvaluationInstrument }>('/ai/rubric', body),
  checklist: (body: { topic: string; gradeId?: number; save?: boolean }) =>
    create<{ source: AiSource; saved: boolean; instrument: EvaluationInstrument }>('/ai/checklist', body),
  ratingScale: (body: { topic: string; scale?: '1-4' | '1-5' | 'AD-A-B-C'; gradeId?: number; save?: boolean }) =>
    create<{ source: AiSource; saved: boolean; instrument: EvaluationInstrument }>('/ai/rating-scale', body),
  exam: (body: { topic: string; title?: string; gradeId?: number; fundamentalId?: number; count: number; types?: QuestionType[]; difficulty?: Difficulty; evaluationType?: EvaluationType; save?: boolean }) =>
    create<{ source: AiSource; saved: boolean; exam?: Exam; questions: Question[] }>('/ai/exam', body),
  activity: (body: { type: ActivityType; topic: string; gradeId?: number; difficulty?: Difficulty; save?: boolean }) =>
    create<{ source: AiSource; saved: boolean; activity: InteractiveActivity }>('/ai/activity', body),
  observation: (body: { studentId: number; type: ObservationType; save?: boolean }) =>
    create<{ source: AiSource; saved: boolean; text?: string; observation?: Observation }>('/ai/observation', body),
  strategies: (body: { sectionId: number; studentIds?: number[]; topic?: string }) =>
    create<{
      source: AiSource
      summary: string
      strategies: Array<{ title: string; description: string }>
      plan: string[]
      students: string[]
    }>('/ai/strategies', body),
  presentation: (lessonPlanId: number) => create<{ source: AiSource; presentation: Presentation }>('/ai/presentation', { lessonPlanId }),
  program: (body: { gradeId: number; schoolYearId?: number; sectionId?: number; save?: boolean }) =>
    create<{ source: AiSource; saved: boolean; title: string; units: LearningUnit[] }>('/ai/program', body),
  quick: (command: 'PROBLEM_OF_DAY' | 'ACTIVE_BREAK' | 'EXIT_TICKET', topic?: string) =>
    create<{ source: AiSource; title: string; text: string; answer?: string; procedure?: string[] }>('/ai/quick', { command, topic }),
  tutor: (message: string) => create<{ source: AiSource; message: TutorMessage }>('/ai/tutor', { message }),
  history: () => q<TutorMessage[]>('/ai/tutor/history'),
  clearHistory: () => remove('/ai/tutor/history'),
}

// ── Notificaciones ────────────────────────────

export const notificationApi = {
  list: (page = 1, pageSize = 15, onlyUnread?: boolean) =>
    q<{ items: Notification[]; totalItems: number; unreadCount: number; page: number; totalPages: number }>('/notifications', {
      page,
      pageSize,
      onlyUnread,
    }),
  unreadCount: () => q<{ count: number }>('/notifications/unread-count'),
  markRead: (id: number) => unwrap(patch(`/notifications/${id}/read`)),
  markAllRead: () => unwrap(patch('/notifications/read-all')),
}

// ── Administración (rol ADMIN) ────────────────

export interface AdminUser {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  roles: string[]
  isActive: boolean
  emailVerified: boolean
  mustChangePassword: boolean
  createdAt: string
}

export const adminApi = {
  users: (page = 1, pageSize = 20, filter: Record<string, string> = {}) => {
    const params: Params = { page, pageSize }
    for (const [k, v] of Object.entries(filter)) if (v) params[`filter[${k}]`] = v
    return q<{ items: AdminUser[]; totalItems: number; page: number; totalPages: number }>('/users', params)
  },
  updateUser: (id: number, body: { firstName: string; lastName: string; role?: string; isActive?: boolean; phoneNumber?: string }) =>
    update<AdminUser>(`/users/${id}`, body),
  deactivate: (id: number) => remove(`/users/${id}`),
  register: (body: { firstName: string; lastName: string; employeeId: string; email: string; password: string; role?: string }) =>
    create<AdminUser>('/auth/register', body),
  roles: () =>
    q<Array<{ id: number; name: string; description?: string; isActive: boolean; permissions: Array<{ id: number; name: string; description?: string; resource: string }> }>>(
      '/roles/all',
    ),
}
