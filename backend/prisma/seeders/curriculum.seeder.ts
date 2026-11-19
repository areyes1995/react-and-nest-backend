// =============================================================================
// 📚 CURRICULUM SEEDER — Adecuación Curricular de Matemática (MINERD)
// =============================================================================
//
// Siembra ejes transversales por ciclo, grados, competencias fundamentales y
// específicas, capacidades, desempeños, contenidos, indicadores de logro y
// criterios de evaluación.
//
// ✅ IDEMPOTENTE — catálogos con clave estable por upsert; contenidos,
//    indicadores y criterios solo se insertan si el grado/ciclo aún no los
//    tiene, para no cambiar los ids referenciados por planificaciones
//    existentes. La competencia de cada indicador se declara explícitamente
//    en el archivo de datos (INDICATOR_FUNDAMENTALS), sin heurísticos.
//
// =============================================================================

import { ContentKind, PrismaClient } from '@prisma/client';
import {
  CROSS_CUTTING_AXES,
  EVALUATION_CRITERIA,
  FUNDAMENTAL_COMPETENCES,
  GRADES,
  INDICATOR_FUNDAMENTALS,
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

  for (const axis of CROSS_CUTTING_AXES) {
    await prisma.crossCuttingAxis.upsert({
      where: { code_cycle: { code: axis.code, cycle: axis.cycle } },
      update: {
        name: axis.name,
        description: axis.description,
        gradeDetails: axis.gradeDetails,
        order: axis.order,
      },
      create: axis,
    });
  }
  console.log(`  ✅  ${CROSS_CUTTING_AXES.length} ejes transversales`);

  for (const g of GRADES) {
    const grade = await prisma.curriculumGrade.upsert({
      where: { code: g.code },
      update: { name: g.name, cycle: g.cycle, order: g.order, focus: g.focus },
      create: { code: g.code, name: g.name, cycle: g.cycle, order: g.order, focus: g.focus },
    });

    let capacityOrder = 0;
    for (const f of FUNDAMENTAL_COMPETENCES) {
      const description = g.specificCompetences[f.code];
      const fundamentalId = fundamentalIds.get(f.code)!;
      const specific = await prisma.specificCompetence.upsert({
        where: { gradeId_fundamentalId: { gradeId: grade.id, fundamentalId } },
        update: { description },
        create: { gradeId: grade.id, fundamentalId, description },
      });

      // La competencia específica del grado se registra también como
      // capacidad explícita; los desempeños se derivan de los indicadores.
      const capacityCode = `${g.code}-${f.code}`;
      const order = capacityOrder++;
      await prisma.capacity.upsert({
        where: { code: capacityCode },
        update: {
          gradeId: grade.id,
          specificCompetenceId: specific.id,
          description,
          order,
        },
        create: {
          code: capacityCode,
          gradeId: grade.id,
          specificCompetenceId: specific.id,
          description,
          order,
        },
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

    const indicatorFundamentals = INDICATOR_FUNDAMENTALS[g.code] ?? [];
    const indicatorCount = await prisma.achievementIndicator.count({ where: { gradeId: grade.id } });
    if (indicatorCount === 0) {
      await prisma.achievementIndicator.createMany({
        data: g.indicators.map((description, order) => {
          const code = indicatorFundamentals[order];
          return {
            gradeId: grade.id,
            fundamentalId: code ? (fundamentalIds.get(code) ?? null) : null,
            description,
            order,
          };
        }),
      });
    } else {
      // Un seed anterior pudo asignar la competencia por heurístico; se
      // corrige la columna sin recrear el indicador (su id se conserva).
      for (const [order, code] of indicatorFundamentals.entries()) {
        const indicator = await prisma.achievementIndicator.findFirst({
          where: { gradeId: grade.id, order },
        });
        if (!indicator || !code) continue;
        await prisma.achievementIndicator.update({
          where: { id: indicator.id },
          data: { fundamentalId: fundamentalIds.get(code) ?? null },
        });
      }
    }

    // Un desempeño por indicador, vinculado a la capacidad de su competencia.
    for (const [order, description] of g.indicators.entries()) {
      const code = indicatorFundamentals[order];
      if (!code) continue;
      const capacity = await prisma.capacity.findUnique({ where: { code: `${g.code}-${code}` } });
      if (!capacity) continue;
      const performanceCode = `${g.code}-${code}-${String(order + 1).padStart(2, '0')}`;
      await prisma.performance.upsert({
        where: { code: performanceCode },
        update: { gradeId: grade.id, capacityId: capacity.id, description, order },
        create: { code: performanceCode, gradeId: grade.id, capacityId: capacity.id, description, order },
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
