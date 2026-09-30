import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { cn } from '@lib/cn'

/** Renderiza LaTeX con KaTeX (modo en línea o bloque). */
export function Latex({ children, block, className }: { children: string; block?: boolean; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, { displayMode: block, throwOnError: false, strict: 'ignore' })
    } catch {
      return children
    }
  }, [children, block])
  return <span className={cn(block && 'block overflow-x-auto py-1', className)} dangerouslySetInnerHTML={{ __html: html }} />
}

/** Texto con fórmulas entre $…$ o $$…$$. */
export function RichMath({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(() => text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g).filter(Boolean), [text])
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.startsWith('$$') ? (
          <Latex key={i} block>
            {p.slice(2, -2)}
          </Latex>
        ) : p.startsWith('$') ? (
          <Latex key={i}>{p.slice(1, -1)}</Latex>
        ) : (
          <span key={i} className="whitespace-pre-line">
            {p}
          </span>
        ),
      )}
    </span>
  )
}
