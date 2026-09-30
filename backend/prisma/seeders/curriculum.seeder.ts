// =============================================================================
// 📚 CURRICULUM SEEDER — Adecuación Curricular de Matemática (MINERD)
// =============================================================================
//
// Siembra grados, competencias fundamentales, competencias específicas,
// contenidos, indicadores de logro y criterios de evaluación.
//
// ✅ IDEMPOTENTE — grados/competencias por upsert; contenidos, indicadores y
//    criterios solo se insertan si el grado/ciclo aún no los tiene, para no
//    cambiar los ids referenciados por planificaciones existentes.
//
// =============================================================================

import { ContentKind, PrismaClient } from '@prisma/client';
import {
  EVALUATION_CRITERIA,
  FUNDAMENTAL_COMPETENCES,
  GRADES,
  type FundamentalCode,
} from './data/curriculum-matematica';

export async function seedCurriculum(prisma: PrismaClient): Promise<void> {
  console.log('📚  Seed del currículo de Matemática…');

  const fundamentalIds = new Map<FundamentalCode, number>();
  for (const f of FUNDAMENTAL_COMPETENCES) {
    const row = await prisma.fundamentalCompetence.upsert({
      where: { code: f.code },
      update: { name: f.name, shortName: f.shortName, gradingBlock: f.gradingBlock, order: f.order },
      create: f,
    });
    fundamentalIds.set(f.code, row.id);
  }
  console.log(`  ✅  ${fundamentalIds.size} competencias fundamentales`);

  for (const g of GRADES) {
    const grade = await prisma.curriculumGrade.upsert({
      where: { code: g.code },
      update: { name: g.name, cycle: g.cycle, order: g.order, focus: g.focus },
      create: { code: g.code, name: g.name, cycle: g.cycle, order: g.order, focus: g.focus },
    });

    for (const [code, description] of Object.entries(g.specificCompetences)) {
      const fundamentalId = fundamentalIds.get(code as FundamentalCode)!;
      await prisma.specificCompetence.upsert({
        where: { gradeId_fundamentalId: { gradeId: grade.id, fundamentalId } },
        update: { description },
        create: { gradeId: grade.id, fundamentalId, description },
      });
    }

    const contentCount = await prisma.curriculumContent.count({ where: { gradeId: grade.id } });
    if (contentCount === 0) {
      let order = 0;
      await prisma.curriculumContent.createMany({
        data: [
          ...g.contents.concepts.map((c) => ({
            gradeId: grade.id,
            kind: ContentKind.CONCEPT,
            block: c.block,
            description: c.description,
            order: order++,
          })),
          ...g.contents.procedures.map((description) => ({
            gradeId: grade.id,
            kind: ContentKind.PROCEDURE,
            description,
            order: order++,
          })),
          ...g.contents.attitudes.map((description) => ({
            gradeId: grade.id,
            kind: ContentKind.ATTITUDE,
            description,
            order: order++,
          })),
        ],
      });
    }

    const indicatorCount = await prisma.achievementIndicator.count({ where: { gradeId: grade.id } });
    if (indicatorCount === 0) {
      await prisma.achievementIndicator.createMany({
        data: g.indicators.map((description, order) => ({
          gradeId: grade.id,
          fundamentalId: guessFundamental(description, fundamentalIds),
          description,
          order,
        })),
      });
    }

    console.log(`  ✅  ${g.name}`);
  }

  for (const [cycle, byFundamental] of Object.entries(EVALUATION_CRITERIA)) {
    const existing = await prisma.evaluationCriterion.count({ where: { cycle: Number(cycle) } });
    if (existing > 0) continue;
    await prisma.evaluationCriterion.createMany({
      data: Object.entries(byFundamental).flatMap(([code, list]) =>
        list.map((description) => ({
          cycle: Number(cycle),
          fundamentalId: fundamentalIds.get(code as FundamentalCode)!,
          description,
        })),
      ),
    });
  }
  console.log('  ✅  criterios de evaluación por ciclo\n');
}

/**
 * Los indicadores del documento siguen el orden de las competencias
 * fundamentales (lee/interpreta/comunica → comunicativa, aplica/representa
 * → lógico, resuelve → problemas…). Se asigna por el verbo inicial.
 */
function guessFundamental(
  description: string,
  ids: Map<FundamentalCode, number>,
): number | null {
  const d = description.toLowerCase();
  const rules: Array<[RegExp, FundamentalCode]> = [
    [/respet|convivencia|espiritual|puesta en común/, 'DESARROLLO_PERSONAL'],
    [/salud|medio ambiente|comunitario/, 'AMBIENTAL_SALUD'],
    [/tecnol|reportes? de investigación|informe de investigación/, 'CIENTIFICA_TECNOLOGICA'],
    [/ética|ético|responsable|actitud/, 'ETICA_CIUDADANA'],
    [/^resuelve|^emplea diferentes|métodos/, 'RESOLUCION_PROBLEMAS'],
    [/^aplica lógicamente|^representa|^toma decisiones|^modela|^razona/, 'PENSAMIENTO_LOGICO'],
    [/^lee|^interpreta|^comunica|^expresa/, 'COMUNICATIVA'],
  ];
  for (const [re, code] of rules) {
    if (re.test(d)) return ids.get(code) ?? null;
  }
  return null;
}
