import type { FinalSituation } from '../shared/grading.calculator';

export const OFFICIAL_SITUATIONS: Record<FinalSituation, string> = {
  A: 'Promovido',
  PENDIENTE: 'Promovido Pendiente',
  R: 'Repite el Grado',
};

export const OFFICIAL_SUBJECTS = [
  'Lengua Española',
  'Matemática',
  'Ciencias Sociales',
  'Ciencias de la Naturaleza',
  'Lenguas Extranjeras (Inglés)',
  'Lenguas Extranjeras (Francés)',
  'Educación Física',
  'Educación Artística',
  'Formación Integral, Humana y Religiosa',
] as const;

export interface OfficialSituationField {
  code: FinalSituation;
  label: string;
}

export interface BulletinExportSource {
  student: { firstName: string; lastName: string; listNumber: number | null };
  grade: string;
  cycle: string;
  level: string;
  section: string;
  passing: number;
  official: {
    centro: string | null;
    distrito: string | null;
    anioEscolar: string;
    numeroFormulario: string;
    nombresDirector: string | null;
    firma: string | null;
    situacion: OfficialSituationField;
  };
  teacher: { name: string };
  blocks: readonly { block: number; code: string; name: string }[];
  entries: Array<{
    period: number;
    block: number;
    score: number | null;
    recovery: number | null;
  }>;
  final: {
    completiveScore: number | null;
    extraordinaryScore: number | null;
    specialScore: number | null;
  } | null;
  summary: {
    blockAverages: Record<number, number | null>;
    finalScore: number | null;
    situation: FinalSituation;
  };
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeFilePart(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'boletin'
  );
}

const safeSignature = (value: string | null) =>
  value &&
  /^data:image\/(?:png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=\s]+$/.test(value)
    ? value
    : null;

const PRINT_STYLES = `
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, 'Times New Roman', sans-serif; color: #111827; font-size: 8pt; }
  .sheet { width: 100%; padding: 2mm; }
  h1 { margin: 0 0 4px; font-size: 12pt; text-align: center; text-transform: uppercase; }
  .meta { margin: 4px 0; font-size: 7.5pt; }
  .meta p { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 1px solid #374151; padding: 2px 1px; text-align: center; vertical-align: middle; overflow-wrap: anywhere; }
  th { background: #f3f4f6; font-size: 7pt; }
  td.subject, th.subject { width: 12%; text-align: left; }
  .head { background: #fde68a; font-weight: bold; }
  .nodata { color: #6b7280; font-style: italic; }
  .situation { display: flex; flex-wrap: wrap; gap: 8px 24px; margin-top: 8px; font-size: 8pt; }
  .signatures { display: flex; flex-wrap: wrap; gap: 16px 48px; margin-top: 16px; font-size: 8pt; }
  .signatures > div { min-width: 180px; border-top: 1px solid #111827; padding-top: 4px; text-align: center; }
  .signatures img { display: block; height: 36px; max-width: 100%; margin: 0 auto 2px; }
  .legend { margin-top: 6px; font-size: 7pt; color: #4b5563; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  @media screen { body { padding: 16px; background: #eef2f7; } .sheet { max-width: 297mm; margin: 0 auto 16px; padding-bottom: 8px; overflow-x: auto; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.15); } .sheet table { min-width: 1100px; } }
  @media print { .sheet { padding: 0; break-after: page; page-break-after: always; } .sheet:last-child { break-after: auto; page-break-after: auto; } }
`;

const wrapDocument = (title: string, body: string) =>
  `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>${PRINT_STYLES}</style></head><body>${body}</body></html>`;

const score = (value: number | null) => (value == null ? '—' : String(value));

function renderSheet(data: BulletinExportSource): string {
  const official = data.official;
  const signature = safeSignature(official.firma);
  const entry = (period: number, block: number, recovery: boolean) =>
    data.entries.find((item) => item.period === period && item.block === block);
  const value = (period: number, block: number, recovery: boolean) =>
    score(
      recovery
        ? (entry(period, block, true)?.recovery ?? null)
        : (entry(period, block, false)?.score ?? null),
    );
  const mathCells = [1, 2, 3, 4]
    .flatMap((block) =>
      [1, 2, 3, 4].flatMap((period) => [
        `<td>${value(period, block, false)}</td>`,
        `<td>${value(period, block, true)}</td>`,
      ]),
    )
    .join('');
  const averageHeaders = [1, 2, 3, 4]
    .map(
      (block) =>
        `<th colspan="8">${escapeHtml(data.blocks.find((item) => item.block === block)?.name ?? `PC${block}`)}</th>`,
    )
    .join('');
  const periodHeaders = [1, 2, 3, 4]
    .map(() =>
      [1, 2, 3, 4]
        .map((period) => `<th>P${period}</th><th>RP${period}</th>`)
        .join(''),
    )
    .join('');
  const averageCells = [1, 2, 3, 4]
    .map(
      (block) =>
        `<td><b>${score(data.summary.blockAverages[block] ?? null)}</b></td>`,
    )
    .join('');
  const noData =
    '<td class="nodata" colspan="40">Sin datos registrados para esta asignatura</td>';
  const rows = OFFICIAL_SUBJECTS.map((subject) =>
    subject === 'Matemática'
      ? `<tr><td class="subject" colspan="2"><b>${escapeHtml(subject)}</b></td>${mathCells}${averageCells}<td><b>${score(data.summary.finalScore)}</b></td><td>${score(data.final?.completiveScore ?? null)}</td><td>${score(data.final?.extraordinaryScore ?? null)}</td><td>${score(data.final?.specialScore ?? null)}</td></tr>`
      : `<tr><td class="subject" colspan="2">${escapeHtml(subject)}</td>${noData}</tr>`,
  ).join('');
  const situations = (Object.keys(OFFICIAL_SITUATIONS) as FinalSituation[])
    .map(
      (code) =>
        `<span>${code === official.situacion.code ? '☑' : '☐'} ${escapeHtml(OFFICIAL_SITUATIONS[code])} <small>(${code})</small></span>`,
    )
    .join('');

  return `<main class="sheet">
    <h1>Boletín de notas · Nivel ${escapeHtml(data.level)}</h1>
    <div class="meta">
      <p><b>Centro:</b> ${escapeHtml(official.centro ?? 'Pendiente de registrar')} &nbsp; <b>Distrito:</b> ${escapeHtml(official.distrito ?? 'Pendiente de registrar')} &nbsp; <b>N.º de formulario (control):</b> ${escapeHtml(official.numeroFormulario)} &nbsp; <b>Año escolar:</b> ${escapeHtml(official.anioEscolar)}</p>
      <p><b>Grado:</b> ${escapeHtml(data.grade)} &nbsp; <b>Ciclo:</b> ${escapeHtml(data.cycle)} &nbsp; <b>Nivel:</b> ${escapeHtml(data.level)} &nbsp; <b>Sección:</b> ${escapeHtml(data.section)}</p>
      <p><b>Nombres y Apellidos:</b> ${escapeHtml(data.student.firstName)} ${escapeHtml(data.student.lastName)} &nbsp; <b>Número:</b> ${escapeHtml(data.student.listNumber ?? '—')} &nbsp; <b>Docente:</b> ${escapeHtml(data.teacher.name)}</p>
    </div>
    <table>
      <thead>
        <tr class="head"><td colspan="42">Registro oficial de calificaciones por competencias</td></tr>
        <tr><th class="subject" rowspan="2" colspan="2">Asignatura Académica</th>${averageHeaders}<th colspan="4">Promedio</th><th rowspan="2">Calificación final</th><th rowspan="2">Calificación completiva</th><th rowspan="2">Calificación extraordinaria</th><th rowspan="2">Calificación especial</th></tr>
        <tr>${periodHeaders}<th>PC1</th><th>PC2</th><th>PC3</th><th>PC4</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="legend">PC1: Competencia comunicativa · PC2: Pensamiento lógico, creativo y resolución de problemas · PC3: Ética y ciudadanía - desarrollo personal · PC4: Científica y tecnológica - ambiental y de la salud. «—» = sin nota registrada. Nota mínima: ${escapeHtml(data.passing)}. Situación: ${escapeHtml(official.situacion.label)} (${escapeHtml(official.situacion.code)}).</p>
    <div class="situation">${situations}</div>
    <div class="signatures">
      <div>${signature ? `<img src="${signature}" alt="Firma del docente" />` : ''}${escapeHtml(data.teacher.name)}<br />Docente</div>
      <div>${escapeHtml(official.nombresDirector ?? 'Pendiente de registrar')}<br />Director(a) del Centro Educativo</div>
    </div>
    <p class="legend">Fuente: Plantilla de boletín y récord de notas (MINERD). Generado con Educraft XYZ.</p>
  </main>`;
}

export function renderBulletinHtml(data: BulletinExportSource): string {
  return wrapDocument(
    `Boletín ${data.student.lastName} ${data.student.firstName}`,
    renderSheet(data),
  );
}

export function renderSectionBulletinsHtml(
  title: string,
  bulletins: BulletinExportSource[],
): string {
  const sheets = bulletins.length
    ? bulletins.map(renderSheet).join('')
    : '<main class="sheet"><p>No hay estudiantes activos en la sección.</p></main>';
  return wrapDocument(title, sheets);
}
