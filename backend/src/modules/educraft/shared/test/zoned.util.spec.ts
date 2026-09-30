import { localParts, sectionLabel } from '../zoned.util';

describe('zoned.util', () => {
  it('abrevia el grado en la etiqueta de la sección', () => {
    expect(sectionLabel('3ro de Secundaria', 'A')).toBe('3° Secundaria A');
    expect(sectionLabel('2do de Secundaria', 'B')).toBe('2° Secundaria B');
    expect(sectionLabel('Nivel Secundario', 'C')).toBe('Nivel Secundario C');
  });

  it('convierte un instante UTC a la hora de Santo Domingo (UTC-4)', () => {
    expect(localParts(new Date('2025-05-15T15:30:00Z'))).toEqual({ date: '2025-05-15', time: '11:30' });
    expect(localParts(new Date('2025-05-16T02:00:00Z'))).toEqual({ date: '2025-05-15', time: '22:00' });
  });
});
