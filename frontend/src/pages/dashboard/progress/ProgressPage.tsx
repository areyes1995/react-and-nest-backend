// ──────────────────────────────────────────────
// ProgressPage — estadísticas del estudiante.
// Dos bloques: avance en la academia y resultados
// en la mesa. Cada métrica lleva su lectura al lado
// porque un número sin interpretación no cambia
// el comportamiento de nadie.
// ──────────────────────────────────────────────

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Flame, Target, TrendingUp, Zap } from 'lucide-react'
import { AcademyPage } from '@components/layout'
import { ProgressBar } from '@components/content'
import { useStudentProgress } from '@features/progress/ProgressContext'
import { levelProgress } from '@features/academy/curriculum'
import { useCurriculum } from '@features/academy/CurriculumContext'

const DECISION_COLORS = ['#34d399', '#f2a93b', '#ef4444']

function Metric({
  icon,
  label,
  value,
  reading,
}: {
  icon: React.ReactNode
  label: string
  value: string
  reading: string
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
      <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1.5">
        {icon}
        <span className="text-caption uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{value}</p>
      <p className="text-caption text-[var(--text-muted)] mt-1 leading-snug">{reading}</p>
    </div>
  )
}

export default function ProgressPage() {
  const { progress, level } = useStudentProgress()
  const { levels, path } = useCurriculum()
  const stats = progress.stats

  const decisions = stats.goodDecisions + stats.okDecisions + stats.mistakes
  const accuracy = decisions > 0 ? Math.round((stats.goodDecisions / decisions) * 100) : 0
  const winRate = stats.handsPlayed > 0 ? Math.round((stats.handsWon / stats.handsPlayed) * 100) : 0
  const vpip =
    stats.handsPlayed > 0 ? Math.round((stats.handsVoluntary / stats.handsPlayed) * 100) : 0

  /** Curva acumulada de fichas: la última mano queda a la derecha. */
  const bankrollSeries = useMemo(() => {
    const ordered = [...progress.hands].reverse()
    let running = 0
    return ordered.map((hand, index) => {
      running += hand.net
      return { hand: index + 1, fichas: running }
    })
  }, [progress.hands])

  const decisionData = [
    { name: 'Correctas', value: stats.goodDecisions },
    { name: 'Aceptables', value: stats.okDecisions },
    { name: 'Mejorables', value: stats.mistakes },
  ].filter(entry => entry.value > 0)

  const completedLessons = Object.keys(progress.lessons).length

  return (
    <AcademyPage
      title="Tu progreso"
      subtitle={`Nivel ${level.level} · ${progress.xp} XP · racha de ${progress.streak} días`}
    >
      <div className="space-y-6">
        {/* ── Métricas principales ── */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={<Target className="w-3.5 h-3.5" strokeWidth={1.5} />}
            label="Clases completadas"
            value={`${completedLessons}/${path.length}`}
            reading={
              completedLessons === 0
                ? 'Empieza por la primera clase de la ruta.'
                : `Has recorrido el ${Math.round((completedLessons / path.length) * 100)}% del programa.`
            }
          />
          <Metric
            icon={<TrendingUp className="w-3.5 h-3.5" strokeWidth={1.5} />}
            label="Decisiones correctas"
            value={`${accuracy}%`}
            reading={
              decisions === 0
                ? 'Juega con el modo entrenamiento para medir esto.'
                : accuracy >= 70
                  ? 'Muy buen criterio: sigue así.'
                  : 'Revisa el panel del coach tras cada mano.'
            }
          />
          <Metric
            icon={<Zap className="w-3.5 h-3.5" strokeWidth={1.5} />}
            label="VPIP"
            value={`${vpip}%`}
            reading={
              stats.handsPlayed === 0
                ? 'Manos en las que entras al bote voluntariamente.'
                : vpip > 35
                  ? 'Estás jugando demasiadas manos.'
                  : vpip < 15
                    ? 'Estás siendo muy conservador.'
                    : 'Rango de manos razonable.'
            }
          />
          <Metric
            icon={<Flame className="w-3.5 h-3.5" strokeWidth={1.5} />}
            label="Manos ganadas"
            value={`${winRate}%`}
            reading={`${stats.handsWon} de ${stats.handsPlayed} manos jugadas.`}
          />
        </div>

        {/* ── Gráficas ── */}
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Evolución de fichas
            </h2>
            {bankrollSeries.length < 2 ? (
              <p className="text-xs text-[var(--text-muted)] py-12 text-center">
                Juega algunas manos en la mesa de práctica y aquí verás tu curva.
              </p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bankrollSeries}>
                    <defs>
                      <linearGradient id="chipsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f2a93b" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#f2a93b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="hand"
                      tick={{ fontSize: '0.625rem', fill: 'var(--text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: '0.625rem', fill: 'var(--text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-active)',
                        borderRadius: 8,
                        fontSize: '0.75rem',
                      }}
                      labelFormatter={value => `Mano ${value}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="fichas"
                      stroke="#f2a93b"
                      strokeWidth={2}
                      fill="url(#chipsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Calidad de tus decisiones
            </h2>
            {decisionData.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-12 text-center">
                Activa el modo entrenamiento en la mesa para registrar tus decisiones.
              </p>
            ) : (
              <>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={decisionData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {decisionData.map((_, index) => (
                          <Cell key={index} fill={DECISION_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-active)',
                          borderRadius: 8,
                          fontSize: '0.75rem',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 mt-2">
                  {decisionData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: DECISION_COLORS[index] }}
                      />
                      <span className="text-[var(--text-secondary)]">{entry.name}</span>
                      <span className="ml-auto text-[var(--text-muted)] tabular-nums">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        {/* ── Avance por nivel ── */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Avance por nivel</h2>
            <Link to="/app/learn" className="text-xs text-[var(--poker-gold)] hover:underline">
              Ver ruta
            </Link>
          </div>

          {levels.map(lvl => {
            const levelStats = levelProgress(lvl, progress.lessons)
            return (
              <div key={lvl.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">{lvl.title}</span>
                  <span className="text-[var(--text-muted)] tabular-nums">
                    {levelStats.done}/{levelStats.total}
                  </span>
                </div>
                <ProgressBar value={levelStats.ratio} color={lvl.color} />
              </div>
            )
          })}
        </section>
      </div>
    </AcademyPage>
  )
}
