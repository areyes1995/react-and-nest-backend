// ──────────────────────────────────────────────
// RecordsPage — routed view of the records area.
// Module + view come from the URL
// (`/app/records/:base?/:view?`), deep-linkable.
// ──────────────────────────────────────────────

import { useRecordsDashboard } from '@records'
import { RecordsView } from '@components/records'
import { HomeOverview } from '@components/home'
import { ViewHeader } from '@components/ui'

export default function RecordsPage() {
  const { activeModule, activeView, selectedCard, menuTitle } = useRecordsDashboard()

  if (activeModule && activeView) {
    const isRag = activeModule.slug === 'records'
    const ragTitle = activeView.kind === 'upload' ? 'rag.upload.title' : 'rag.search.title'
    return (
      <div className="flex flex-col h-full">
        <ViewHeader
          title={isRag ? ragTitle : activeView.label}
          subtitle={activeModule.label}
        />
        <div className="flex-1 min-h-0 flex flex-col">
          <RecordsView module={activeModule} view={activeView} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ViewHeader title={selectedCard} subtitle={menuTitle} />
      <HomeOverview />
    </div>
  )
}