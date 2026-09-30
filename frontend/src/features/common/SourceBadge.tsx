import { Sparkles, Wand2 } from 'lucide-react'
import type { AiSource } from '@services/types'
import { Badge } from '@components/ui'

/** Indica si el contenido lo generó el proveedor de IA o las plantillas oficiales. */
export function SourceBadge({ source }: { source?: AiSource }) {
  if (!source) return null
  return source === 'ai' ? (
    <Badge tone="pink">
      <Sparkles className="h-3 w-3" /> Generado con IA
    </Badge>
  ) : (
    <Badge tone="purple">
      <Wand2 className="h-3 w-3" /> Plantilla pedagógica
    </Badge>
  )
}
