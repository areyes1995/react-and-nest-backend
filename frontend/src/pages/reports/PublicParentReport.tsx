import { useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { reportApi } from '@services/educraft'
import { useAsync } from '@hooks/useAsync'
import { Button, ErrorState, Spinner } from '@components/ui'
import { Logo } from '@components/brand/Logo'
import { ParentReportView, parentReportHtml } from '@/features/reports/StudentReports'
import { printDocument } from '@lib/exporters'
import { formatDate } from '@lib/format'

/** Informe compartido con la familia mediante enlace seguro (sin sesión). */
export default function PublicParentReport() {
  const { token = '' } = useParams()
  const { data, error } = useAsync(() => reportApi.publicReport(token), [token])

  return (
    <div className="frame min-h-dvh p-3 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <Logo compact />
          {data && (
            <Button variant="secondary" icon={<Printer className="h-4 w-4" />} onClick={() => printDocument('Informe para la familia', parentReportHtml(data), false)}>
              Imprimir / PDF
            </Button>
          )}
        </div>
        <div className="card card-pad">
          {error ? <ErrorState message={error} /> : !data ? <Spinner /> : <ParentReportView report={data} />}
        </div>
        {data?.expiresAt && <p className="text-center text-xs text-ink-3">Enlace de solo lectura válido hasta el {formatDate(data.expiresAt)}.</p>}
      </div>
    </div>
  )
}
