import { normalizeDocumentId, parseStudentCsv } from './student-csv.util';

describe('parseStudentCsv', () => {
  it('lee cabeceras en español con separador ";" y fechas dd/mm/aaaa', () => {
    const csv =
      'No.;Apellidos;Nombres;Tutor;Teléfono del tutor;Correo del tutor;Documento;Fecha de nacimiento;Género\r\n' +
      '1;Pérez Santos;Ana María;María;809-555-0101;ana@ejemplo.com;001-0000001-2;15/03/2015;Femenino\r\n';

    expect(parseStudentCsv(csv)).toEqual([
      {
        row: 2,
        dto: {
          listNumber: 1,
          lastName: 'Pérez Santos',
          firstName: 'Ana María',
          guardianName: 'María',
          guardianPhone: '809-555-0101',
          guardianEmail: 'ana@ejemplo.com',
          documentId: '001-0000001-2',
          birthDate: '2015-03-15',
          gender: 'F',
        },
      },
    ]);
  });

  it('detecta comas y campos entrecomillados con comas internas', () => {
    const csv = 'Apellidos,Nombres,Documento\n"Gómez, Ruiz",Luis,ABC-123\n';
    expect(parseStudentCsv(csv)[0].dto).toMatchObject({
      lastName: 'Gómez, Ruiz',
      firstName: 'Luis',
      documentId: 'ABC-123',
    });
  });

  it('devuelve una lista vacía cuando no hay filas de datos', () => {
    expect(parseStudentCsv('Apellidos;Nombres\n')).toEqual([]);
  });
});

describe('normalizeDocumentId', () => {
  it('ignora espacios, puntos y guiones', () => {
    expect(normalizeDocumentId(' 001-000.0001-2 ')).toBe('00100000012');
    expect(normalizeDocumentId(undefined)).toBeUndefined();
  });
});
