import { NormalizationUtil } from 'src/shared/utils/normalization.util';

describe('NormalizationUtil', () => {
  it('convierte a minúsculas y quita tildes', () => {
    expect(NormalizationUtil.normalize('Álvaro Méndez')).toBe('alvaromendez');
  });

  it('elimina símbolos, espacios y guiones', () => {
    expect(NormalizationUtil.normalize('Álvaro Méndez-123!')).toBe(
      'alvaromendez123',
    );
  });

  it('cadena vacía retorna vacía', () => {
    expect(NormalizationUtil.normalize('')).toBe('');
  });

  it('preserva solo números si no hay letras', () => {
    expect(NormalizationUtil.normalize('123 456')).toBe('123456');
  });

  it('quita eñes con diacrítico descompuesto y deja n', () => {
    // Ñ en NFD = N + combining tilde → se elimina el tilde
    expect(NormalizationUtil.normalize('Niño')).toBe('nino');
  });

  it('elimina todo lo no alfanumérico', () => {
    expect(NormalizationUtil.normalize('a@b#c$d%e')).toBe('abcde');
  });
});
