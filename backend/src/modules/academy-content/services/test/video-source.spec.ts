// ──────────────────────────────────────────────
// El administrador pega lo que tiene a mano. Estas
// son las formas reales que llegan desde el
// navegador y todas deben acabar en el mismo ID.
// ──────────────────────────────────────────────

import { normalizeVideo } from '../video-source';

describe('normalizeVideo — YouTube', () => {
  const cases = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'dQw4w9WgXcQ',
  ];

  it.each(cases)('extrae el ID de %s', url => {
    expect(normalizeVideo('YOUTUBE', url)).toEqual({
      provider: 'YOUTUBE',
      value: 'dQw4w9WgXcQ',
    });
  });

  it('descarta lo que no es un video', () => {
    expect(normalizeVideo('YOUTUBE', 'https://example.com/foo').value).toBeNull();
  });
});

describe('normalizeVideo — Vimeo y MP4', () => {
  it('extrae el ID de Vimeo', () => {
    expect(normalizeVideo('VIMEO', 'https://vimeo.com/123456789').value).toBe('123456789');
    expect(normalizeVideo('VIMEO', 'https://vimeo.com/video/123456789').value).toBe('123456789');
  });

  it('exige http(s) en los MP4', () => {
    expect(normalizeVideo('MP4', 'https://cdn.example.com/clase.mp4').value).toBe(
      'https://cdn.example.com/clase.mp4',
    );
    expect(normalizeVideo('MP4', '../../etc/passwd').value).toBeNull();
  });
});

describe('normalizeVideo — sin fuente', () => {
  it('devuelve NONE cuando no hay proveedor o URL', () => {
    expect(normalizeVideo('NONE', 'https://youtu.be/dQw4w9WgXcQ')).toEqual({
      provider: 'NONE',
      value: null,
    });
    expect(normalizeVideo('YOUTUBE', '   ').value).toBeNull();
  });
});
