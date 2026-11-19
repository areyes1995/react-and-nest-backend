import type { CreateStudentDto } from './dto/section.dto';

/** Columnas aceptadas en español (se normalizan sin acentos ni puntuación). */
const HEADER_ALIASES: Record<string, keyof CreateStudentDto> = {
  no: 'listNumber',
  n: 'listNumber',
  numero: 'listNumber',
  numerodelista: 'listNumber',
  listnumber: 'listNumber',
  apellidos: 'lastName',
  apellido: 'lastName',
  lastname: 'lastName',
  nombres: 'firstName',
  nombre: 'firstName',
  firstname: 'firstName',
  documento: 'documentId',
  documentoid: 'documentId',
  documentid: 'documentId',
  cedula: 'documentId',
  dni: 'documentId',
  identificacion: 'documentId',
  fechanacimiento: 'birthDate',
  fechadenacimiento: 'birthDate',
  fechadenacer: 'birthDate',
  nacimiento: 'birthDate',
  birthdate: 'birthDate',
  genero: 'gender',
  sexo: 'gender',
  gender: 'gender',
  tutor: 'guardianName',
  apoderado: 'guardianName',
  guardianname: 'guardianName',
  telefonodeltutor: 'guardianPhone',
  telefono: 'guardianPhone',
  telefonos: 'guardianPhone',
  celular: 'guardianPhone',
  guardianphone: 'guardianPhone',
  correodeltutor: 'guardianEmail',
  correo: 'guardianEmail',
  correoelectronico: 'guardianEmail',
  email: 'guardianEmail',
  guardianemail: 'guardianEmail',
  notas: 'notes',
  observaciones: 'notes',
  notes: 'notes',
};

export interface ParsedStudentRow {
  row: number;
  dto: CreateStudentDto;
}

const normalizeKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export function normalizeDocumentId(value?: string | null): string | undefined {
  const key = value
    ?.trim()
    .toUpperCase()
    .replace(/[\s.\-/]/g, '');
  return key || undefined;
}

function normalizeDate(value: string): string | undefined {
  const text = value.trim();
  if (!text) return undefined;
  const spanish = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(text);
  if (spanish)
    return `${spanish[3]}-${spanish[2].padStart(2, '0')}-${spanish[1].padStart(2, '0')}`;
  return text;
}

function normalizeGender(value: string): string | undefined {
  const text = value.trim().toUpperCase();
  if (!text) return undefined;
  if (text.startsWith('F')) return 'F';
  if (text.startsWith('M') || text.startsWith('H')) return 'M';
  return text.slice(0, 1);
}

function countOutsideQuotes(line: string, separator: string): number {
  let count = 0;
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (quoted && line[i + 1] === '"') i++;
      else quoted = !quoted;
    } else if (!quoted && line[i] === separator) count++;
  }
  return count;
}

function detectSeparator(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  return [',', ';', '\t', '|'].reduce(
    (best, candidate) =>
      countOutsideQuotes(firstLine, candidate) >
      countOutsideQuotes(firstLine, best)
        ? candidate
        : best,
    ',',
  );
}

/** Parser minimalista: comillas dobles, saltos CRLF y separador autodetectado. */
export function parseDelimited(text: string, separator: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += char;
    } else if (char === '"' && field.trim() === '') {
      quoted = true;
    } else if (char === separator) {
      row.push(field.trim());
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field.trim());
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length) {
    row.push(field.trim());
    if (row.some((cell) => cell !== '')) rows.push(row);
  }
  return rows;
}

/**
 * Convierte un CSV con cabeceras en español a filas candidatas a CreateStudentDto.
 * Si no hay cabeceras reconocibles, aplica el orden de la plantilla por defecto.
 */
export function parseStudentCsv(text: string): ParsedStudentRow[] {
  const clean = text.replace(/^\uFEFF/, '');
  const matrix = parseDelimited(clean, detectSeparator(clean));
  if (!matrix.length) return [];

  const headerIndex = matrix.findIndex(
    (cells) =>
      cells.some(
        (cell) => HEADER_ALIASES[normalizeKey(cell)] === 'firstName',
      ) &&
      cells.some((cell) => HEADER_ALIASES[normalizeKey(cell)] === 'lastName'),
  );
  const fields: Array<keyof CreateStudentDto> =
    headerIndex >= 0
      ? matrix[headerIndex].map((cell) => HEADER_ALIASES[normalizeKey(cell)])
      : [
          'listNumber',
          'lastName',
          'firstName',
          'guardianName',
          'guardianPhone',
          'guardianEmail',
        ];
  const body = matrix.slice(headerIndex >= 0 ? headerIndex + 1 : 0);

  return body.map((cells, index) => {
    const raw: Record<string, string | number | undefined> = {};
    fields.forEach((field, i) => {
      const value = cells[i]?.trim();
      if (!value || !field) return;
      switch (field) {
        case 'listNumber': {
          const parsed = Number(value);
          if (Number.isInteger(parsed) && parsed > 0) raw.listNumber = parsed;
          break;
        }
        case 'birthDate':
          raw.birthDate = normalizeDate(value);
          break;
        case 'gender':
          raw.gender = normalizeGender(value);
          break;
        default:
          raw[field] = value;
      }
    });
    return {
      row: headerIndex >= 0 ? headerIndex + index + 2 : index + 1,
      dto: raw as unknown as CreateStudentDto,
    };
  });
}
