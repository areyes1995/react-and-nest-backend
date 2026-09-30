import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Camera, Save } from 'lucide-react'
import { teacherApi } from '@services/educraft'
import type { TeacherProfile } from '@services/types'
import { useFeedback } from '@context/ToastContext'
import type { ShellContext } from '@components/layout/AppShell'
import { Avatar, Button, Card, CardHeader, Field, Input, Spinner, Textarea } from '@components/ui'
import { SignaturePad, resizeImage } from './SignaturePad'

export function ProfileTab() {
  const { profile, setProfile } = useOutletContext<ShellContext>()
  const { success, error } = useFeedback()
  const [form, setForm] = useState<TeacherProfile | null>(profile)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) setForm(profile)
    else teacherApi.profile().then(setForm).catch(() => undefined)
  }, [profile])

  if (!form) return <Spinner />
  const tp = form.teacherProfile
  const setTp = (patch: Partial<TeacherProfile['teacherProfile']>) => setForm({ ...form, teacherProfile: { ...tp, ...patch } })

  const save = async () => {
    setSaving(true)
    try {
      const updated = await teacherApi.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber ?? undefined,
        displayTitle: tp.displayTitle ?? undefined,
        specialty: tp.specialty,
        institution: tp.institution ?? undefined,
        district: tp.district ?? undefined,
        bio: tp.bio ?? undefined,
        avatarUrl: tp.avatarUrl ?? '',
        signature: tp.signature ?? '',
      })
      setProfile(updated)
      success('Perfil actualizado')
    } catch (err) {
      error('No se pudo guardar', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
      <Card className="card-pad">
        <CardHeader title="Datos del docente" subtitle="Aparecen en planificaciones, boletines e informes." />
        <div className="mb-5 flex items-center gap-4">
          <div className="relative">
            <Avatar name={`${form.firstName} ${form.lastName}`} src={tp.avatarUrl} size={72} />
            <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-brand-gradient text-white shadow" aria-label="Cambiar foto">
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) setTp({ avatarUrl: await resizeImage(f) })
              }}
            />
          </div>
          <div>
            <p className="text-base font-bold">
              {tp.displayTitle} {form.firstName} {form.lastName}
            </p>
            <p className="text-sm text-ink-3">{form.email}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre">
            <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Apellido">
            <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
          <Field label="Tratamiento" hint="Prof., Lic., Mtra.…">
            <Input value={tp.displayTitle ?? ''} onChange={(e) => setTp({ displayTitle: e.target.value })} />
          </Field>
          <Field label="Especialidad">
            <Input value={tp.specialty} onChange={(e) => setTp({ specialty: e.target.value })} />
          </Field>
          <Field label="Centro educativo">
            <Input value={tp.institution ?? ''} onChange={(e) => setTp({ institution: e.target.value })} />
          </Field>
          <Field label="Distrito educativo">
            <Input value={tp.district ?? ''} onChange={(e) => setTp({ district: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <Input value={form.phoneNumber ?? ''} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          </Field>
        </div>
        <Field label="Sobre mí" className="mt-3">
          <Textarea value={tp.bio ?? ''} onChange={(e) => setTp({ bio: e.target.value })} rows={3} />
        </Field>
        <div className="mt-4 flex justify-end">
          <Button onClick={save} loading={saving} icon={<Save className="h-4 w-4" />}>
            Guardar perfil
          </Button>
        </div>
      </Card>
      <Card className="card-pad">
        <CardHeader title="Firma digital" subtitle="Se imprime en boletines y planificaciones." />
        <SignaturePad value={tp.signature} onChange={(signature) => setTp({ signature })} />
        <p className="mt-3 text-xs text-ink-3">Recuerda guardar el perfil para conservar la firma.</p>
      </Card>
    </div>
  )
}
