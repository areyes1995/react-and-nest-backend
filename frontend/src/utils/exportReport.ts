export type ReportData = Array<Record<string, string | number>>

export type ReportConfig = {
  title: string
  headers: string[]
  data: ReportData
  fileName: string
}

const generateCSV = (config: ReportConfig): Blob => {
  const csvContent = [
    config.headers.join(','),
    ...config.data.map(row =>
      Object.values(row)
        .map(val => `"${typeof val === 'string' ? val.replace(/"/g, '""') : val}"`)
        .join(',')
    ),
  ].join('\n')

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
}

const generateExcel = (config: ReportConfig): Blob => {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <table>
          <thead>
            <tr>${config.headers.map(h => `<th style="background:#f5f5f5;font-weight:bold;">${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${config.data.map(row =>
              `<tr>${Object.values(row).map(val => `<td>${val}</td>`).join('')}</tr>`
            ).join('\n')}
          </tbody>
        </table>
      </body>
    </html>
  `.trim()

  return new Blob([html], { type: 'application/vnd.ms-excel' })
}

const generatePDF = (config: ReportConfig): void => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head><title>${config.title}</title></head>
      <body style="padding:20px;font-family:sans-serif;">
        <h1>${config.title}</h1>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f5f5f5;">
              ${config.headers.map(h => `<th style="border:1px solid #ddd;padding:8px;text-align:left;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${config.data.map(row =>
              `<tr>${Object.values(row).map(val => `<td style="border:1px solid #ddd;padding:8px;">${val}</td>`).join('')}</tr>`
            ).join('\n')}
          </tbody>
        </table>
        <script>window.print();</script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

export type ExportFunction = (config: ReportConfig) => void

export const exportReport = (
  format: 'pdf' | 'csv' | 'excel',
  config: ReportConfig
): void => {
  if (format === 'csv') {
    const blob = generateCSV(config)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = config.fileName
    link.click()
    URL.revokeObjectURL(url)
  } else if (format === 'excel') {
    const blob = generateExcel(config)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = config.fileName
    link.click()
    URL.revokeObjectURL(url)
  } else if (format === 'pdf') {
    generatePDF(config)
  }
}
