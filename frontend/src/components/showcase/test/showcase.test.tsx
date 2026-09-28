import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProgressProvider } from '@features/progress/ProgressContext'
import { DAILY_GOAL_XP, EMPTY_PROGRESS, today } from '@features/progress/store'
import { StaticCurriculumProvider } from '@features/academy/CurriculumContext'
import { FIXTURE_LEVELS } from '@features/academy/test/fixtures'
import { AlmostThere, DailyChallenge, ProgramIncludes, WhatYouLearn } from '..'

function withProviders(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <ProgressProvider>{ui}</ProgressProvider>
    </MemoryRouter>,
  )
}

describe('WhatYouLearn', () => {
  it('muestra las pendientes primero y despliega el resto', () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ text: `Habilidad ${i}`, learned: i === 0 }))
    render(<WhatYouLearn items={items} initialVisible={3} trackProgress />)
    expect(screen.getByText('Ya dominas 1 de 5. Cada curso que terminas marca las suyas.')).toBeInTheDocument()
    expect(screen.queryByText('Habilidad 0')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Mostrar 2 más'))
    expect(screen.getByText('Habilidad 0')).toBeInTheDocument()
    expect(screen.getByText('Dominada')).toBeInTheDocument()
  })
})

describe('ProgramIncludes', () => {
  it('no enseña cifras de comunidad inventadas', () => {
    render(
      <StaticCurriculumProvider levels={FIXTURE_LEVELS} stats={{ lessons: 6, minutes: 60 }}>
        <ProgramIncludes />
      </StaticCurriculumProvider>,
    )
    expect(screen.queryByText(/estudiantes/)).not.toBeInTheDocument()
    expect(screen.getByText('1 h de clases en 6 lecciones')).toBeInTheDocument()
  })
})

describe('DailyChallenge', () => {
  it('con el cofre cerrado dice cuánto falta', () => {
    withProviders(<DailyChallenge nextLessonHref="/app/classes" />)
    expect(screen.getByText('Retos de hoy')).toBeInTheDocument()
    expect(screen.getByText(`Cumple la meta de hoy (faltan ${DAILY_GOAL_XP} XP) para abrirlo.`)).toBeInTheDocument()
    expect(screen.getByLabelText('Cofre cerrado')).toBeDisabled()
  })

  it('con la meta cumplida se abre y enseña el premio', () => {
    vi.useFakeTimers()
    localStorage.setItem(
      'poker_academy_progress_v1',
      JSON.stringify({ ...EMPTY_PROGRESS, xp: DAILY_GOAL_XP, dailyXp: { [today()]: DAILY_GOAL_XP } }),
    )
    withProviders(<DailyChallenge nextLessonHref="/app/classes" />)
    fireEvent.click(screen.getByLabelText('Abrir el cofre del día'))
    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(screen.getByText(/¡Premio (del día|gordo)!/)).toBeInTheDocument()
    vi.useRealTimers()
  })
})

describe('AlmostThere', () => {
  it('enseña el siguiente nivel y el logro más cercano', () => {
    withProviders(<AlmostThere />)
    expect(screen.getByText('Nivel 2: te faltan 250 XP')).toBeInTheDocument()
    expect(screen.getByText('Ver todos los logros')).toBeInTheDocument()
  })
})
