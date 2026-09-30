import { useEffect, useRef, useState } from 'react'
import { Eraser, Upload } from 'lucide-react'
import { Button } from '@components/ui'

/** Lienzo para dibujar la firma digital (exporta PNG en data URL). */
export function SignaturePad({ value, onChange }: { value: string | null; onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [dirty, setDirty] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = value
    }
  }, [value])

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    }
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    const ctx = e.currentTarget.getContext('2d')!
    const { x, y } = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = e.currentTarget.getContext('2d')!
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1e1b4b'
    const { x, y } = pos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setDirty(true)
  }
  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    onChange(canvasRef.current!.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setDirty(false)
    onChange(null)
  }

  const upload = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const ratio = Math.min(canvas.width / img.width, canvas.height / img.height)
        ctx.drawImage(img, (canvas.width - img.width * ratio) / 2, (canvas.height - img.height * ratio) / 2, img.width * ratio, img.height * ratio)
        onChange(canvas.toDataURL('image/png'))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-36 w-full touch-none rounded-2xl border-2 border-dashed border-violet-200 bg-white dark:border-violet-900"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" icon={<Eraser className="h-3.5 w-3.5" />} onClick={clear}>
          Borrar
        </Button>
        <Button size="sm" variant="secondary" icon={<Upload className="h-3.5 w-3.5" />} onClick={() => fileRef.current?.click()}>
          Subir imagen
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <span className="text-xs text-ink-3">{dirty ? 'Firma modificada (guarda los cambios).' : 'Dibuja tu firma con el ratón o el dedo.'}</span>
      </div>
    </div>
  )
}

/** Redimensiona una imagen a un data URL cuadrado (fotos de perfil). */
export function resizeImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')!
        const s = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
