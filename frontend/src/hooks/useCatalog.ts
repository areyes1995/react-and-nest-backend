// Catálogos compartidos (grados, competencias, secciones) con caché en memoria.

import { useEffect, useState } from 'react'
import { curriculumApi, sectionApi } from '@services/educraft'
import type { CurriculumGrade, FundamentalCompetence, GradeCurriculum, Section } from '@services/types'

let gradesCache: Promise<CurriculumGrade[]> | null = null
let fundamentalsCache: Promise<FundamentalCompetence[]> | null = null
const gradeDetailCache = new Map<number, Promise<GradeCurriculum>>()

export function useGrades() {
  const [grades, setGrades] = useState<CurriculumGrade[]>([])
  useEffect(() => {
    gradesCache ??= curriculumApi.grades()
    gradesCache.then(setGrades).catch(() => {
      gradesCache = null
    })
  }, [])
  return grades
}

export function useFundamentals() {
  const [items, setItems] = useState<FundamentalCompetence[]>([])
  useEffect(() => {
    fundamentalsCache ??= curriculumApi.fundamentals()
    fundamentalsCache.then(setItems).catch(() => {
      fundamentalsCache = null
    })
  }, [])
  return items
}

export function useGradeCurriculum(gradeId?: number | null) {
  const [data, setData] = useState<GradeCurriculum | null>(null)
  useEffect(() => {
    if (!gradeId) {
      setData(null)
      return
    }
    if (!gradeDetailCache.has(gradeId)) gradeDetailCache.set(gradeId, curriculumApi.grade(gradeId))
    let alive = true
    gradeDetailCache
      .get(gradeId)!
      .then((d) => alive && setData(d))
      .catch(() => gradeDetailCache.delete(gradeId))
    return () => {
      alive = false
    }
  }, [gradeId])
  return data
}

export function useSections() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const reload = () => {
    setLoading(true)
    return sectionApi
      .list()
      .then(setSections)
      .catch(() => setSections([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    void reload()
  }, [])
  return { sections, loading, reload }
}
