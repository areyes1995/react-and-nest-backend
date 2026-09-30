import { useState } from 'react'
import { teacherApi } from '@services/educraft'
import { useAsync } from '@hooks/useAsync'
import { ErrorState, Skeleton } from '@components/ui'
import { WelcomeBanner } from './widgets/WelcomeBanner'
import { QuickAccess } from './widgets/QuickAccess'
import { TodayClasses } from './widgets/TodayClasses'
import { ClassSummary } from './widgets/ClassSummary'
import { CalendarWidget } from './widgets/CalendarWidget'
import { AiWidget } from './widgets/AiWidget'
import { AlertsWidget } from './widgets/AlertsWidget'
import { EcosystemCards } from './widgets/EcosystemCards'
import { QuoteCard } from './widgets/QuoteCard'
import { SetupBanner } from './widgets/SetupBanner'

/** Panel de inicio ("Dashboard activo") del docente. */
export default function DashboardPage() {
  const [period, setPeriod] = useState<number | undefined>(undefined)
  const { data, error, loading, reload } = useAsync(() => teacherApi.dashboard(period), [period])

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data)
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-28" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )

  return (
    <div className={loading ? 'opacity-80 transition' : 'transition'}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-4">
          <WelcomeBanner title={data.teacher.displayTitle} name={data.teacher.firstName} />
          {(!data.schoolYear || data.sections.length === 0) && <SetupBanner hasYear={!!data.schoolYear} />}
          <QuickAccess dashboard={data} onChange={reload} />
          <div className="grid gap-4 lg:grid-cols-2">
            <TodayClasses classes={data.todayClasses} />
            <ClassSummary dashboard={data} period={period} onPeriod={setPeriod} />
          </div>
          <EcosystemCards />
        </div>
        <div className="space-y-4">
          <CalendarWidget today={data.now.date} />
          <AiWidget />
          <AlertsWidget alerts={data.alerts} />
          <QuoteCard seed={data.now.date} />
        </div>
      </div>
    </div>
  )
}
