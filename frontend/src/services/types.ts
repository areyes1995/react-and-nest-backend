// ──────────────────────────────────────────────
// Tipos del dominio académico (espejo de la API).
// ──────────────────────────────────────────────

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'
export type EvaluationType = 'DIAGNOSTIC' | 'FORMATIVE' | 'SUMMATIVE'
export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'DEVELOPMENT'
  | 'MATCHING'
  | 'COMPLETE'
  | 'GRAPH'
  | 'PROBLEM'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type InstrumentType = 'RUBRIC' | 'CHECKLIST' | 'RATING_SCALE'
export type ObservationType = 'CONDUCT' | 'PARTICIPATION' | 'SITUATION'
export type CalendarEventType =
  | 'CLASS'
  | 'EXAM'
  | 'MEETING'
  | 'DELIVERY'
  | 'INSTITUTIONAL'
  | 'CIVIC'
  | 'VACATION'
  | 'HOLIDAY'
  | 'REMINDER'
export type ResourceCategory =
  | 'IMAGE'
  | 'ICON'
  | 'ILLUSTRATION'
  | 'CHART'
  | 'GEOMETRY'
  | 'TEMPLATE'
  | 'BACKGROUND'
  | 'VIDEO'
  | 'ANIMATION'
  | 'PDF'
  | 'OWN'
export type ContentKind = 'CONCEPT' | 'PROCEDURE' | 'ATTITUDE'
export type LessonPlanStatus = 'DRAFT' | 'READY' | 'TAUGHT'
export type UnitKind = 'ANNUAL_PROGRAM' | 'UNIT' | 'LEARNING_EXPERIENCE' | 'PROJECT'
export type ActivityType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'MATCHING'
  | 'COMPLETE'
  | 'ORDER_STEPS'
  | 'DRAG_DROP'
  | 'SOLVE_OPERATIONS'
  | 'CARTESIAN_POINTS'
  | 'ROULETTE'
  | 'MEMORY'
  | 'ESCAPE_ROOM'
  | 'QUIZ_GAME'
export type AchievementLevel = 'INICIO' | 'EN_PROCESO' | 'LOGRADO' | 'EXCELENTE'
export type AiSource = 'ai' | 'template'

// ── Currículo ─────────────────────────────────

export interface CurriculumGrade {
  id: number
  code: string
  name: string
  cycle: number
  order: number
  focus: string | null
}

export interface FundamentalCompetence {
  id: number
  code: string
  name: string
  shortName: string
  gradingBlock: number
  order: number
}

export interface SpecificCompetence {
  id: number
  gradeId: number
  fundamentalId: number
  description: string
  fundamental: FundamentalCompetence
}

export interface AchievementIndicator {
  id: number
  gradeId: number
  fundamentalId: number | null
  description: string
  order: number
}

export interface CurriculumContent {
  id: number
  gradeId: number
  kind: ContentKind
  block: string | null
  description: string
  order: number
}

export interface GradeCurriculum extends CurriculumGrade {
  specificCompetences: SpecificCompetence[]
  indicators: AchievementIndicator[]
  contents: CurriculumContent[]
  criteria: Array<{ id: number; cycle: number; fundamentalId: number; description: string }>
}

export interface ResolvedCurriculum {
  competences: SpecificCompetence[]
  indicators: AchievementIndicator[]
  contents: CurriculumContent[]
}

// ── Año escolar y secciones ───────────────────

export interface AcademicPeriod {
  id: number
  number: number
  name: string
  startDate: string
  endDate: string
}

export interface Holiday {
  id: number
  name: string
  date: string
  isNational: boolean
}

export interface SchoolYear {
  id: number
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  teachingWeeks: number | null
  gradingScale: { type: string; passing: number }
  periods: AcademicPeriod[]
  holidays: Holiday[]
  _count?: { sections: number }
  calendar?: Array<{
    week: number
    start: string
    end: string
    period: number | null
    teachingDays: number
    holidays: string[]
  }>
}

export interface ClassSchedule {
  id?: number
  weekday: number
  startTime: string
  endTime: string
  topic?: string | null
}

export interface Section {
  id: number
  schoolYearId: number
  gradeId: number
  name: string
  subject: string
  color: string
  room: string | null
  grade: CurriculumGrade
  schoolYear: { id: number; name: string; isActive: boolean }
  schedules: ClassSchedule[]
  _count: { students: number }
  students?: Student[]
}

export interface Student {
  id: number
  sectionId: number
  listNumber: number | null
  firstName: string
  lastName: string
  documentId: string | null
  birthDate: string | null
  gender: string | null
  guardianName: string | null
  guardianPhone: string | null
  guardianEmail: string | null
  notes: string | null
  isActive: boolean
  section?: { id: number; name: string; color: string; grade: CurriculumGrade }
}

export interface Observation {
  id: number
  studentId: number
  type: ObservationType
  content: string
  date: string
  aiGenerated: boolean
}

export interface Evidence {
  id: number
  studentId: number
  assessmentId: number | null
  title: string
  description: string | null
  url: string | null
  storageKey: string | null
  mimeType: string | null
  createdAt: string
  assessment?: { id: number; title: string } | null
}

// ── Calificaciones ────────────────────────────

export interface GradeEntry {
  period: number
  block: number
  score: number | null
  recovery: number | null
  isManual?: boolean
}

export interface FinalEntry {
  completiveScore: number | null
  extraordinaryScore: number | null
  specialScore: number | null
}

export interface GradeSummary {
  effective: Record<number, Record<number, number | null>>
  blockAverages: Record<number, number | null>
  periodAverages: Record<number, number | null>
  finalScore: number | null
  completiveFinal: number | null
  extraordinaryFinal: number | null
  specialTotal: number | null
  situation: 'A' | 'R' | 'PENDIENTE'
}

export interface GradingBlock {
  block: number
  code: string
  name: string
}

export interface GradeRegister {
  section: { id: number; name: string; grade: CurriculumGrade; schoolYear: string; passing: number }
  blocks: GradingBlock[]
  rows: Array<{
    student: Pick<Student, 'id' | 'listNumber' | 'firstName' | 'lastName' | 'isActive'>
    entries: GradeEntry[]
    final: FinalEntry | null
    summary: GradeSummary
  }>
  stats: { average: number | null; approved: number; failed: number; pending: number }
}

export interface Assessment {
  id: number
  sectionId: number
  title: string
  description: string | null
  type: EvaluationType
  period: number
  block: number
  fundamentalId: number | null
  instrumentId: number | null
  examId: number | null
  date: string
  dueDate: string | null
  maxScore: number
  weight: number
  requiresDelivery: boolean
  section?: { id: number; name: string; color: string; grade: CurriculumGrade }
  fundamental?: FundamentalCompetence | null
  instrument?: { id: number; title: string; type: InstrumentType } | null
  exam?: { id: number; title: string } | null
  _count?: { scores: number }
}

export interface AssessmentDetail extends Assessment {
  instrument: EvaluationInstrument | null
  roster: Array<{
    student: Pick<Student, 'id' | 'listNumber' | 'firstName' | 'lastName'>
    score: number | null
    delivered: boolean
    feedback: string | null
    instrumentData: Record<string, unknown> | null
  }>
}

// ── Asistencia ────────────────────────────────

export type AttendanceCounts = Record<AttendanceStatus, number>

export interface AttendanceRoster {
  section: { id: number; name: string; grade: string; color: string }
  date: string
  taken: boolean
  students: Array<{
    id: number
    listNumber: number | null
    firstName: string
    lastName: string
    status: AttendanceStatus | null
    note: string | null
  }>
}

export interface AttendanceStats {
  sectionId: number
  counts: AttendanceCounts
  rate: number | null
  days: Array<{ date: string; counts: AttendanceCounts; rate: number | null }>
  students: Array<{
    id: number
    listNumber: number | null
    firstName: string
    lastName: string
    counts: AttendanceCounts
    rate: number | null
  }>
}

// ── Planificación ─────────────────────────────

export interface LessonMoment {
  moment: 'INICIO' | 'DESARROLLO' | 'CIERRE'
  minutes: number
  activities: string[]
  metacognition?: string
  evidences?: string[]
  techniques?: string[]
  resources?: string[]
}

export interface LessonPlanInput {
  gradeId: number
  sectionId?: number | null
  unitId?: number | null
  title: string
  topic: string
  date?: string | null
  durationMinutes?: number
  purpose?: string | null
  strategies?: string[]
  status?: LessonPlanStatus
  specificCompetenceIds?: number[]
  indicatorIds?: number[]
  contentIds?: number[]
  moments: LessonMoment[]
  evaluation?: Record<string, unknown> | null
  assignment?: string | null
  aiGenerated?: boolean
}

export interface LessonPlan extends LessonPlanInput {
  id: number
  status: LessonPlanStatus
  grade: CurriculumGrade
  section: { id: number; name: string; color: string } | null
  unit: { id: number; title: string; kind: UnitKind } | null
  curriculum?: ResolvedCurriculum
  createdAt: string
  updatedAt: string
  _count?: { presentations: number }
}

export interface LearningUnit {
  id: number
  gradeId: number
  schoolYearId: number | null
  sectionId: number | null
  kind: UnitKind
  title: string
  description: string | null
  startDate: string | null
  endDate: string | null
  order: number
  color: string | null
  specificCompetenceIds: number[]
  indicatorIds: number[]
  contentIds: number[]
  evaluationCriteria: string[]
  evidences: string[]
  aiGenerated: boolean
  grade?: CurriculumGrade
  section?: { id: number; name: string } | null
  _count?: { lessonPlans: number }
  lessonPlans?: Array<Pick<LessonPlan, 'id' | 'title' | 'topic' | 'date' | 'status'>>
  curriculum?: ResolvedCurriculum
}

export type SlideBlock =
  | { type: 'text'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'formula'; latex: string }
  | { type: 'image'; url: string; caption?: string }
  | { type: 'video'; url: string }
  | { type: 'question'; prompt: string; options?: string[]; answer?: string }
  | { type: 'table'; rows: string[][] }

export interface Slide {
  id: string
  layout: string
  title: string
  subtitle?: string
  blocks: SlideBlock[]
  notes?: string
}

export interface Presentation {
  id: number
  title: string
  subtitle: string | null
  theme: string
  slides: Slide[]
  lessonPlanId: number | null
  lessonPlan?: { id: number; title: string } | null
  aiGenerated: boolean
  updatedAt: string
}

export interface InteractiveActivity {
  id: number
  type: ActivityType
  title: string
  topic: string | null
  gradeId: number | null
  instructions: string | null
  content: Record<string, unknown>
  aiGenerated: boolean
  grade?: CurriculumGrade | null
  updatedAt: string
}

// ── Evaluación ────────────────────────────────

export interface Question {
  id: number
  gradeId: number | null
  fundamentalId: number | null
  topic: string
  type: QuestionType
  difficulty: Difficulty
  statement: string
  options: unknown
  answer: unknown
  solution: string | null
  points: number
  tags: string[]
  aiGenerated: boolean
  grade?: CurriculumGrade | null
  fundamental?: FundamentalCompetence | null
}

export interface Exam {
  id: number
  title: string
  gradeId: number | null
  fundamentalId: number | null
  evaluationType: EvaluationType
  instructions: string | null
  durationMinutes: number | null
  versions: number
  shuffle: boolean
  aiGenerated: boolean
  grade?: CurriculumGrade | null
  questions?: Array<{ questionId: number; order: number; points: number | null; question: Question }>
  _count?: { questions: number }
  updatedAt: string
}

export interface ExamVersions {
  exam: { id: number; title: string; instructions: string | null; durationMinutes: number | null }
  versions: Array<{
    label: string
    totalPoints: number
    questions: Array<{
      number: number
      questionId: number
      type: QuestionType
      statement: string
      options?: string[]
      points: number
      answer: unknown
      solution: string | null
    }>
    answerKey: Array<{ number: number; answer: string }>
  }>
}

export interface RubricContent {
  levels: string[]
  scores?: number[]
  criteria: Array<{ criterion: string; weight: number; descriptors: string[] }>
}

export interface ChecklistContent {
  items: Array<{ text: string }>
}

export interface RatingScaleContent {
  scale: string
  levels: Array<{ value: string; label: string }>
  items: Array<{ text: string }>
}

export interface EvaluationInstrument {
  id: number
  type: InstrumentType
  title: string
  description: string | null
  gradeId: number | null
  fundamentalId: number | null
  content: RubricContent | ChecklistContent | RatingScaleContent
  aiGenerated: boolean
  grade?: CurriculumGrade | null
  updatedAt: string
}

// ── Agenda y biblioteca ───────────────────────

export interface AgendaItem {
  key: string
  source: 'event' | 'class' | 'holiday'
  id: number | null
  type: CalendarEventType
  title: string
  description?: string | null
  date: string
  startTime?: string | null
  endTime?: string | null
  allDay: boolean
  color?: string | null
  section?: { id: number; name: string; grade: string; color: string } | null
  lessonPlanId?: number | null
  assessmentId?: number | null
}

export interface CalendarEventDetail {
  id: number
  type: CalendarEventType
  title: string
  description: string | null
  startAt: string
  endAt: string | null
  allDay: boolean
  sectionId: number | null
  section?: Section | null
  lessonPlan?: { id: number; title: string; topic: string } | null
  assessmentId: number | null
  delivery: { students: number; delivered: number; graded: number } | null
}

export interface LibraryResource {
  id: number
  title: string
  description: string | null
  category: ResourceCategory
  tags: string[]
  url: string | null
  storageKey: string | null
  fileName: string | null
  mimeType: string | null
  sizeBytes: number | null
  updatedAt: string
}

// ── Reportes ──────────────────────────────────

export interface SectionPerformance {
  section: { id: number; name: string; grade: string; color: string; schoolYear: string; passing: number }
  period: number | null
  summary: { students: number; average: number | null; attendanceRate: number | null; approved: number; atRisk: number }
  blocks: Array<GradingBlock & { average: number | null; distribution: Record<AchievementLevel, number> }>
  rows: Array<{
    student: Pick<Student, 'id' | 'listNumber' | 'firstName' | 'lastName'>
    score: number | null
    level: AchievementLevel | null
    blocks: Record<number, number | null>
    situation: GradeSummary['situation']
    attendance: { counts: AttendanceCounts; rate: number | null }
    observations: Partial<Record<ObservationType, number>>
  }>
}

export interface CompetenceDetail {
  section: SectionPerformance['section']
  block: GradingBlock | null
  average: number | null
  levels: Record<AchievementLevel, Array<{ id: number; name: string; score: number | null }>>
}

export interface Bulletin {
  student: Pick<Student, 'id' | 'listNumber' | 'firstName' | 'lastName'>
  grade: string
  cycle: string
  level: string
  section: string
  subject: string
  schoolYear: string
  teacher: { name: string; institution: string | null; signature: string | null }
  blocks: GradingBlock[]
  entries: GradeEntry[]
  final: FinalEntry | null
  summary: GradeSummary
  passing: number
}

export interface ParentReport extends Bulletin {
  generatedAt: string
  attendance: { counts: AttendanceCounts; total: number; rate: number | null }
  competences: Array<{ block: number; name: string; score: number | null; level: AchievementLevel | null }>
  strengths: string[]
  improvements: string[]
  observations: Array<{ type: ObservationType; content: string; date: string }>
  recommendations: string[]
  expiresAt?: string
}

export interface ReportLink {
  id: number
  token: string
  studentId: number
  expiresAt: string
  revokedAt: string | null
  createdAt: string
}

export interface Alert {
  kind: 'LOW_PERFORMANCE' | 'LOW_ATTENDANCE' | 'PENDING_DELIVERY' | 'SUSTAINED_LOW' | 'TO_GRADE'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  section: { id: number; name: string; grade: string }
  students: Array<{ id: number; name: string; value?: number | null; detail?: string }>
  assessmentIds?: number[]
}

export interface StudentRecord {
  student: Student & { section: Section & { schoolYear: SchoolYear } }
  attendance: { counts: AttendanceCounts; total: number; rate: number | null; recent: Array<{ date: string; status: AttendanceStatus; note: string | null }> }
  grades: { entries: GradeEntry[]; final: FinalEntry | null; summary: GradeSummary }
  activities: Array<{
    id: number
    title: string
    date: string
    period: number
    block: number
    type: EvaluationType
    maxScore: number
    score: number | null
    delivered: boolean
    feedback: string | null
  }>
  observations: Observation[]
  evidences: Evidence[]
  reportLinks: ReportLink[]
}

// ── Docente ───────────────────────────────────

export interface TeacherProfile {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  teacherProfile: {
    displayTitle: string | null
    specialty: string
    institution: string | null
    district: string | null
    avatarUrl: string | null
    signature: string | null
    bio: string | null
    googleCalendarSync: boolean
    preferences: Record<string, unknown>
  }
}

export type ClassStatus = 'EN_PROGRESO' | 'PROXIMA' | 'PROGRAMADA' | 'FINALIZADA'

export interface Dashboard {
  teacher: {
    firstName: string
    lastName: string
    displayTitle: string | null
    specialty: string
    avatarUrl: string | null
  }
  now: { date: string; time: string }
  schoolYear: {
    id: number
    name: string
    periods: Array<{ number: number; name: string; startDate: string; endDate: string }>
    currentPeriod: number | null
  } | null
  sections: Array<{ id: number; name: string; grade: string; color: string }>
  todayClasses: Array<{
    key: string
    section: { id: number; name: string; grade: string; color: string } | null
    startTime: string | null
    endTime: string | null
    topic: string | null
    lessonPlanId: number | null
    status: ClassStatus
  }>
  summary: {
    period: number | null
    students: number
    average: number | null
    attendanceRate: number | null
    atRisk: number
    competences: Array<GradingBlock & { average: number | null }>
  }
  upcoming: AgendaItem[]
  alerts: Alert[]
}

export interface SearchResults {
  students: Array<{ id: number; name: string; section: string }>
  lessonPlans: Array<{ id: number; title: string; topic: string; date: string | null }>
  resources: Array<{ id: number; title: string; category: ResourceCategory }>
  evaluations: Array<{ id: number; title: string; kind: string }>
}

// ── IA ────────────────────────────────────────

export interface StepSolution {
  kind: string
  input: string
  inputLatex: string
  steps: Array<{ title: string; explanation: string; latex: string }>
  answer: string
  answerLatex: string
  source: AiSource
}

export interface GeneratedProblem {
  statement: string
  procedure: string[]
  solution: string
  answer: string
  latex?: string
  easierVariant: { statement: string; answer: string }
  harderVariant: { statement: string; answer: string }
}

export interface TutorMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface Notification {
  id: number
  type: 'GENERIC' | 'INFO' | 'WARNING' | 'ERROR'
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
}
