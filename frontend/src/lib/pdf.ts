// Extracción de texto de PDF en el navegador (pdf.js, carga diferida).

const PDF_TYPE = 'application/pdf';
const PDF_EXT = /\.pdf$/i;
const TEXT_TYPE = /^text\//i;
const TEXT_EXT = /\.(txt|md|markdown)$/i;
const MEDIA_TYPE = /^(image|audio|video)\//i;
const OTHER_BINARY_EXT = /\.(png|jpe?g|gif|webp|bmp|tiff?|heic|svg|mp3|wav|ogg|oga|opus|m4a|aac|flac|wma|mp4|mov|avi|mkv|webm|ogv|3gp|zip|doc|docx|xls|xlsx|ppt|pptx)$/i;

export const UNSUPPORTED_MEDIA_MESSAGE =
  'Este archivo es una imagen, audio o video: esta versión no incluye OCR ni análisis de audio/video, así que no puedo leer su contenido. La opción compatible es pegar el texto en el chat para que el tutor lo use.'
export const SCANNED_PDF_MESSAGE =
  'Este PDF no tiene texto seleccionable (posiblemente escaneado). Esta versión no incluye OCR, así que no puedo leerlo. Pega el texto en el chat y el tutor podrá usarlo.'

const isPdf = (file: File) => file.type === PDF_TYPE || PDF_EXT.test(file.name)
const isText = (file: File) => TEXT_TYPE.test(file.type) || TEXT_EXT.test(file.name)

export function unsupportedMediaReason(file: File): string | null {
  if (MEDIA_TYPE.test(file.type) || OTHER_BINARY_EXT.test(file.name)) return UNSUPPORTED_MEDIA_MESSAGE
  if (isPdf(file) || isText(file)) return null
  return UNSUPPORTED_MEDIA_MESSAGE
}

export async function extractPdfText(file: File, maxPages = 30): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages: string[] = []
  for (let i = 1; i <= Math.min(doc.numPages, maxPages); i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    pages.push(
      content.items
        .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : ''))
        .join('')
        .trim(),
    )
  }
  return pages.join('\n\n')
}

export async function readDocumentText(file: File): Promise<string> {
  const reason = unsupportedMediaReason(file)
  if (reason) throw new Error(reason)
  if (isPdf(file)) {
    const text = await extractPdfText(file)
    if (!text.trim()) throw new Error(SCANNED_PDF_MESSAGE)
    return text
  }
  return file.text()
}
