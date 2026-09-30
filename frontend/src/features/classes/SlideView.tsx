import type { Slide, SlideBlock } from '@services/types'
import { Latex, RichMath } from '@components/ui'
import { LogoMark } from '@components/brand/Logo'
import { cn } from '@lib/cn'

export const LAYOUT_THEME: Record<string, { bg: string; accent: string; label: string }> = {
  title: { bg: 'from-pink-100 via-fuchsia-50 to-violet-100', accent: 'text-pink-500', label: 'Portada' },
  reflection: { bg: 'from-violet-100 to-fuchsia-50', accent: 'text-violet-500', label: 'Reflexión del día' },
  feedback: { bg: 'from-blue-50 to-violet-50', accent: 'text-blue-500', label: 'Retroalimentación' },
  purpose: { bg: 'from-amber-50 to-pink-50', accent: 'text-amber-500', label: 'Propósito' },
  agenda: { bg: 'from-emerald-50 to-sky-50', accent: 'text-emerald-500', label: 'Tabla de contenido' },
  section: { bg: 'from-fuchsia-100 via-pink-50 to-violet-100', accent: 'text-fuchsia-500', label: 'Sección' },
  content: { bg: 'from-white to-violet-50', accent: 'text-violet-500', label: 'Contenido' },
  activities: { bg: 'from-orange-50 to-amber-50', accent: 'text-orange-500', label: 'Actividades' },
  assignment: { bg: 'from-violet-100 to-pink-100', accent: 'text-pink-500', label: 'Asignación' },
  task: { bg: 'from-sky-50 to-blue-50', accent: 'text-sky-500', label: 'Tarea' },
  closing: { bg: 'from-pink-100 via-violet-50 to-fuchsia-100', accent: 'text-violet-500', label: 'Cierre' },
}

const CENTERED = new Set(['title', 'section', 'assignment', 'reflection', 'closing'])

function Block({ block, big }: { block: SlideBlock; big?: boolean }) {
  const text = big ? 'text-[1.6em]' : 'text-[1em]'
  switch (block.type) {
    case 'text':
      return <p className={cn('leading-snug text-violet-950', text)}><RichMath text={block.text} /></p>
    case 'bullets':
      return (
        <ul className={cn('space-y-[0.35em] text-violet-950', text)}>
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-[0.5em]">
              <span className="mt-[0.45em] h-[0.45em] w-[0.45em] shrink-0 rounded-full bg-pink-400" />
              <span><RichMath text={item} /></span>
            </li>
          ))}
        </ul>
      )
    case 'formula':
      return (
        <div className="rounded-[0.6em] bg-white/70 px-[0.8em] py-[0.4em] text-[1.4em] text-violet-900">
          <Latex block>{block.latex}</Latex>
        </div>
      )
    case 'image':
      return (
        <figure className="flex flex-col items-center">
          <img src={block.url} alt={block.caption ?? ''} className="max-h-[11em] rounded-[0.6em] object-contain shadow" />
          {block.caption && <figcaption className="mt-[0.3em] text-[0.8em] text-violet-700">{block.caption}</figcaption>}
        </figure>
      )
    case 'video': {
      const yt = /(?:youtu\.be\/|v=)([\w-]{11})/.exec(block.url)?.[1]
      return yt ? (
        <iframe className="aspect-video w-[70%] rounded-[0.6em]" src={`https://www.youtube.com/embed/${yt}`} title="Video" allowFullScreen />
      ) : (
        <a href={block.url} target="_blank" rel="noreferrer" className="text-[1em] font-semibold text-pink-600 underline">
          ▶ Ver video
        </a>
      )
    }
    case 'question':
      return (
        <div className="rounded-[0.6em] border-[0.1em] border-dashed border-orange-300 bg-white/70 p-[0.6em]">
          <p className={cn('font-semibold text-violet-950', text)}>❓ <RichMath text={block.prompt} /></p>
          {block.options && (
            <ol className="mt-[0.3em] grid grid-cols-2 gap-[0.3em] text-[0.85em] text-violet-800">
              {block.options.map((o, i) => (
                <li key={i}>{String.fromCharCode(97 + i)}) {o}</li>
              ))}
            </ol>
          )}
        </div>
      )
    case 'table':
      return (
        <table className="w-full border-collapse text-[0.8em] text-violet-950">
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={cn('border border-violet-200 px-[0.4em] py-[0.2em]', i === 0 && 'bg-violet-100 font-bold')}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
  }
}

/**
 * Diapositiva 16:9. El tamaño de letra escala con el ancho del
 * contenedor (container queries) para verse igual en miniatura,
 * editor y proyección.
 */
export function SlideView({ slide, className, number }: { slide: Slide; className?: string; number?: number }) {
  const theme = LAYOUT_THEME[slide.layout] ?? LAYOUT_THEME.content
  const centered = CENTERED.has(slide.layout)
  return (
    <div
      className={cn('relative aspect-video w-full overflow-hidden rounded-[0.9rem] bg-gradient-to-br shadow-card', theme.bg, className)}
      style={{ containerType: 'inline-size' }}
    >
      <div className="absolute inset-0 text-[clamp(5px,2.1cqw,34px)]">
        <div className="pointer-events-none absolute -right-[8%] -top-[18%] h-[55%] w-[30%] rounded-full bg-white/40" />
        <div className="pointer-events-none absolute -bottom-[20%] -left-[6%] h-[45%] w-[24%] rounded-full bg-pink-200/40" />
        <div className={cn('relative flex h-full flex-col px-[6%] py-[5%]', centered && 'items-center justify-center text-center')}>
          <p className={cn('text-[0.75em] font-bold uppercase tracking-[0.2em]', theme.accent)}>{theme.label}</p>
          <h2 className={cn('mt-[0.2em] font-extrabold leading-tight text-violet-950', centered ? 'text-[2.6em]' : 'text-[1.9em]')}>{slide.title}</h2>
          {slide.subtitle && <p className={cn('mt-[0.3em] text-[1.2em] font-semibold', theme.accent)}>{slide.subtitle}</p>}
          <div className={cn('mt-[0.8em] min-h-0 flex-1 space-y-[0.6em] overflow-hidden', centered && 'flex max-w-[80%] flex-col items-center justify-center')}>
            {slide.blocks.map((b, i) => (
              <Block key={i} block={b} big={centered} />
            ))}
          </div>
        </div>
        <div className="absolute bottom-[3%] right-[3%] flex items-center gap-[0.3em] text-[0.6em] font-semibold text-violet-400">
          <LogoMark size={14} /> Educraft XYZ {number != null && `· ${number}`}
        </div>
      </div>
    </div>
  )
}

/** Convierte las diapositivas al formato de exportación PPTX. */
export function slidesToPpt(slides: Slide[]) {
  return slides.map((s) => ({
    title: s.title,
    subtitle: s.subtitle,
    layout: s.layout,
    notes: s.notes,
    text: s.blocks.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n') || undefined,
    formulas: s.blocks.filter((b) => b.type === 'formula').map((b) => (b as { latex: string }).latex),
    bullets: s.blocks.flatMap((b) =>
      b.type === 'bullets' ? b.items : b.type === 'question' ? [`❓ ${b.prompt}${b.options ? ' — ' + b.options.map((o, i) => `${String.fromCharCode(97 + i)}) ${o}`).join('  ') : ''}`] : [],
    ),
  }))
}
