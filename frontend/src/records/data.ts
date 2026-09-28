// ──────────────────────────────────────────────
// Records domain — mock data
// ──────────────────────────────────────────────

import type { RecordData, RecordStatus } from './types'

export const sampleData: RecordData[] = [
  { id: 'R-001', title: 'HR Reports', category: 'Human Resources', status: 'Active', lastUpdated: '01/03/2024', owner: 'Ana López' },
  { id: 'R-002', title: 'Licenses', category: 'Compliance', status: 'Active', lastUpdated: '15/02/2024', owner: 'Carlos Ruiz' },
  { id: 'R-003', title: 'Vacations', category: 'Human Resources', status: 'Pending', lastUpdated: '10/01/2024', owner: 'María García' },
  { id: 'R-004', title: 'Coaching Forms', category: 'Development', status: 'Active', lastUpdated: '05/03/2024', owner: 'Pedro Martínez' },
  { id: 'R-005', title: 'Sales', category: 'Sales', status: 'Active', lastUpdated: '20/02/2024', owner: 'Laura Sánchez' },
  { id: 'R-006', title: 'Onboarding Docs', category: 'Human Resources', status: 'Pending', lastUpdated: '28/02/2024', owner: 'Ana López' },
  { id: 'R-007', title: 'Payroll Records', category: 'Finance', status: 'Archived', lastUpdated: '01/12/2023', owner: 'Jorge Pérez' },
  { id: 'R-008', title: 'Training Materials', category: 'Development', status: 'Active', lastUpdated: '10/03/2024', owner: 'María García' },
  { id: 'R-009', title: 'Audit Reports', category: 'Compliance', status: 'Pending', lastUpdated: '05/03/2024', owner: 'Carlos Ruiz' },
  { id: 'R-010', title: 'Client Contracts', category: 'Legal', status: 'Active', lastUpdated: '18/02/2024', owner: 'Laura Sánchez' },
]

export const coachingData: RecordData[] = [
  { id: 'CF-001', title: 'New Hire Onboarding', category: 'Onboarding', status: 'Active', lastUpdated: '12/03/2024', coach: 'Ana López', sessions: 4 },
  { id: 'CF-002', title: 'Leadership Workshop', category: 'Leadership', status: 'Active', lastUpdated: '08/03/2024', coach: 'Pedro Martínez', sessions: 2 },
  { id: 'CF-003', title: 'Feedback Cycle Q1', category: 'Performance', status: 'Pending', lastUpdated: '22/02/2024', coach: 'María García', sessions: 6 },
  { id: 'CF-004', title: 'Sprint Retro', category: 'Agile', status: 'Active', lastUpdated: '19/03/2024', coach: 'Carlos Ruiz', sessions: 1 },
  { id: 'CF-005', title: 'Mentoring Program', category: 'Development', status: 'Active', lastUpdated: '02/03/2024', coach: 'Laura Sánchez', sessions: 8 },
  { id: 'CF-006', title: '1:1 Reviews 2023', category: 'Performance', status: 'Archived', lastUpdated: '10/12/2023', coach: 'Jorge Pérez', sessions: 12 },
  { id: 'CF-007', title: 'Team Sync Template', category: 'Meetings', status: 'Pending', lastUpdated: '15/03/2024', coach: 'Ana López', sessions: 3 },
  { id: 'CF-008', title: 'Skill Gap Survey', category: 'Development', status: 'Active', lastUpdated: '25/02/2024', coach: 'María García', sessions: 2 },
]

export const vacationsData: RecordData[] = [
  { id: 'VA-001', title: 'Summer Break — Ana', leaveType: 'Summer', status: 'Pending', lastUpdated: '11/03/2024', employee: 'Ana López', days: 15 },
  { id: 'VA-002', title: 'Weekend Trip — Carlos', leaveType: 'Short Leave', status: 'Active', lastUpdated: '28/02/2024', employee: 'Carlos Ruiz', days: 2 },
  { id: 'VA-003', title: 'Medical Leave — María', leaveType: 'Medical', status: 'Active', lastUpdated: '05/03/2024', employee: 'María García', days: 5 },
  { id: 'VA-004', title: 'Family Vacation — Pedro', leaveType: 'Summer', status: 'Pending', lastUpdated: '14/03/2024', employee: 'Pedro Martínez', days: 10 },
  { id: 'VA-005', title: 'Year-End Holidays', leaveType: 'Holiday', status: 'Active', lastUpdated: '20/12/2023', employee: 'Laura Sánchez', days: 7 },
  { id: 'VA-006', title: 'Paternity Leave — Jorge', leaveType: 'Medical', status: 'Archived', lastUpdated: '01/11/2023', employee: 'Jorge Pérez', days: 12 },
  { id: 'VA-007', title: 'Remote Week — Laura', leaveType: 'Short Leave', status: 'Active', lastUpdated: '17/03/2024', employee: 'Laura Sánchez', days: 4 },
]

export const salesData: RecordData[] = [
  { id: 'SA-001', title: 'Q1 Pipeline Review', stage: 'Pipeline', status: 'Active', lastUpdated: '18/03/2024', amount: 125000, owner: 'Laura Sánchez' },
  { id: 'SA-002', title: 'Enterprise Deal — Acme', stage: 'Deals', status: 'Pending', lastUpdated: '12/03/2024', amount: 400000, owner: 'Pedro Martínez' },
  { id: 'SA-003', title: 'Renewals Q1', stage: 'Renewals', status: 'Active', lastUpdated: '01/03/2024', amount: 85000, owner: 'Carlos Ruiz' },
  { id: 'SA-004', title: 'Upsell Campaign', stage: 'Campaigns', status: 'Active', lastUpdated: '06/03/2024', amount: 60000, owner: 'Ana López' },
  { id: 'SA-005', title: 'New Logo Wins', stage: 'Deals', status: 'Pending', lastUpdated: '22/02/2024', amount: 220000, owner: 'María García' },
  { id: 'SA-006', title: 'Q4 Closed Won', stage: 'Deals', status: 'Archived', lastUpdated: '05/01/2024', amount: 310000, owner: 'Laura Sánchez' },
  { id: 'SA-007', title: 'Partner Referrals', stage: 'Referrals', status: 'Active', lastUpdated: '10/03/2024', amount: 45000, owner: 'Jorge Pérez' },
]

export const licensesData: RecordData[] = [
  { id: 'LI-001', title: 'Windows Enterprise', vendor: 'Microsoft', status: 'Active', lastUpdated: '14/03/2024', seats: 120, owner: 'Carlos Ruiz' },
  { id: 'LI-002', title: 'Adobe Creative Cloud', vendor: 'Adobe', status: 'Active', lastUpdated: '09/03/2024', seats: 45, owner: 'Ana López' },
  { id: 'LI-003', title: 'JetBrains Suite', vendor: 'JetBrains', status: 'Pending', lastUpdated: '03/03/2024', seats: 30, owner: 'Pedro Martínez' },
  { id: 'LI-004', title: 'Microsoft 365', vendor: 'Microsoft', status: 'Active', lastUpdated: '20/02/2024', seats: 250, owner: 'María García' },
  { id: 'LI-005', title: 'Cloud Security Pro', vendor: 'Sentinel', status: 'Active', lastUpdated: '16/03/2024', seats: 60, owner: 'Laura Sánchez' },
  { id: 'LI-006', title: 'Legacy Antivirus 2023', vendor: 'Norton', status: 'Archived', lastUpdated: '28/12/2023', seats: 90, owner: 'Jorge Pérez' },
  { id: 'LI-007', title: 'Dev Tools — Team', vendor: 'JetBrains', status: 'Pending', lastUpdated: '12/03/2024', seats: 40, owner: 'Carlos Ruiz' },
]

export const permissionsData: RecordData[] = [
  { id: 'PE-001', title: 'Admin Console Access', scope: 'Admin', status: 'Active', lastUpdated: '13/03/2024', role: 'Owner', owner: 'Jorge Pérez' },
  { id: 'PE-002', title: 'Finance Module — Read', scope: 'Finance', status: 'Active', lastUpdated: '07/03/2024', role: 'Viewer', owner: 'Laura Sánchez' },
  { id: 'PE-003', title: 'API Keys — Stage', scope: 'API', status: 'Pending', lastUpdated: '24/02/2024', role: 'Developer', owner: 'Carlos Ruiz' },
  { id: 'PE-004', title: 'HR Data — Restricted', scope: 'HR', status: 'Active', lastUpdated: '18/02/2024', role: 'Editor', owner: 'Ana López' },
  { id: 'PE-005', title: 'Deploy Rights — Prod', scope: 'Infra', status: 'Pending', lastUpdated: '15/03/2024', role: 'Admin', owner: 'Pedro Martínez' },
  { id: 'PE-006', title: 'Legacy Reviewer Role', scope: 'Roles', status: 'Archived', lastUpdated: '02/11/2023', role: 'Reviewer', owner: 'María García' },
  { id: 'PE-007', title: 'Audit Trail Viewer', scope: 'Audit', status: 'Active', lastUpdated: '11/03/2024', role: 'Viewer', owner: 'Jorge Pérez' },
]

/** Lookup of module label → its own dataset. */
export const RECORDS_BY_MODULE: Record<string, RecordData[]> = {
  'Records View': sampleData,
  'Coaching Forms': coachingData,
  Vacations: vacationsData,
  Sales: salesData,
  Licenses: licensesData,
  Permissions: permissionsData,
}

/** Returns the dataset for a module label (falls back to `sampleData`). */
export function getRecordsForModule(label: string | undefined): RecordData[] {
  if (!label) return sampleData
  return RECORDS_BY_MODULE[label] ?? sampleData
}

export interface ModuleDataEntry {
  label: string
  color: string
  data: RecordData[]
}

/** All modules consolidated for the global overview. */
export const ALL_MODULE_DATA: ModuleDataEntry[] = [
  { label: 'Records View', color: 'red', data: sampleData },
  { label: 'Coaching Forms', color: 'purple', data: coachingData },
  { label: 'Vacations', color: 'green', data: vacationsData },
  { label: 'Sales', color: 'amber', data: salesData },
  { label: 'Licenses', color: 'blue', data: licensesData },
  { label: 'Permissions', color: 'pink', data: permissionsData },
]

/** Flattened rows across all modules. */
export function getAllModuleRecords(): RecordData[] {
  return ALL_MODULE_DATA.flatMap(entry => entry.data)
}

export const RECORD_STATUSES: RecordStatus[] = ['Active', 'Pending', 'Archived']

export interface StatusMeta {
  label: string
  color: string
  bar: string
}

export const STATUS_META: Record<RecordStatus, StatusMeta> = {
  Active: { label: 'Active', color: 'text-green-400', bar: 'bg-green-400' },
  Pending: { label: 'Pending', color: 'text-amber-400', bar: 'bg-amber-400' },
  Archived: { label: 'Archived', color: 'text-gray-400', bar: 'bg-gray-400' },
}

/** Map of module color token → Tailwind bar class. */
export const MODULE_BAR_COLORS: Record<string, string> = {
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  pink: 'bg-pink-500',
}