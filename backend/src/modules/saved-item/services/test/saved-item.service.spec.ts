import { SavedItemService } from 'src/modules/saved-item/services/saved-item.service';

const ROW = {
  id: 1,
  kind: 'ARTICLE',
  contentId: 'a-errores-principiante',
  title: 'Siete errores',
  url: '/app/articles/siete-errores',
  note: null,
  createdAt: new Date('2026-03-01T10:00:00.000Z'),
};

function makePrisma(overrides: any = {}) {
  return {
    savedItem: {
      findMany: jest.fn().mockResolvedValue([ROW]),
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue(ROW),
      delete: jest.fn().mockResolvedValue(ROW),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      ...(overrides.savedItem ?? {}),
    },
  } as any;
}

describe('SavedItemService', () => {
  it('findForUser devuelve la vista pública del estudiante', async () => {
    const prisma = makePrisma();
    const out = await new SavedItemService(prisma).findForUser(7);

    expect(out).toEqual({
      persisted: true,
      items: [
        {
          kind: 'ARTICLE',
          contentId: 'a-errores-principiante',
          title: 'Siete errores',
          url: '/app/articles/siete-errores',
          note: null,
          createdAt: '2026-03-01T10:00:00.000Z',
        },
      ],
    });
    expect(prisma.savedItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 7 } }),
    );
  });

  it('sin la tabla creada devuelve vacío en vez de reventar', async () => {
    const prisma = makePrisma({
      savedItem: { findMany: jest.fn().mockRejectedValue({ code: 'P2021' }) },
    });
    await expect(new SavedItemService(prisma).findForUser(7)).resolves.toEqual({
      items: [],
      persisted: false,
    });
  });

  it('un error que no sea "falta la tabla" se propaga', async () => {
    const prisma = makePrisma({
      savedItem: { findMany: jest.fn().mockRejectedValue({ code: 'P1001' }) },
    });
    await expect(
      new SavedItemService(prisma).findForUser(7),
    ).rejects.toMatchObject({
      code: 'P1001',
    });
  });

  it('guardar es idempotente: upsert sobre (usuario, tipo, contenido)', async () => {
    const prisma = makePrisma();
    await new SavedItemService(prisma).save(7, 'ARTICLE', 'a-1', {
      title: '  Título  ',
    });

    expect(prisma.savedItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_kind_contentId: {
            userId: 7,
            kind: 'ARTICLE',
            contentId: 'a-1',
          },
        },
      }),
    );
    // El título llega recortado y el resto, a null: nada de cadenas vacías.
    expect(prisma.savedItem.upsert.mock.calls[0][0].create).toMatchObject({
      title: 'Título',
      url: null,
      note: null,
    });
  });

  it('toggle guarda si no estaba', async () => {
    const prisma = makePrisma();
    const out = await new SavedItemService(prisma).toggle(
      7,
      'VIDEO',
      'v-1',
      {},
    );

    expect(out.saved).toBe(true);
    expect(out.item).not.toBeNull();
    expect(prisma.savedItem.delete).not.toHaveBeenCalled();
  });

  it('toggle quita si ya estaba', async () => {
    const prisma = makePrisma({
      savedItem: {
        findUnique: jest.fn().mockResolvedValue({ ...ROW, id: 42 }),
      },
    });
    const out = await new SavedItemService(prisma).toggle(
      7,
      'ARTICLE',
      'a-1',
      {},
    );

    expect(out).toEqual({ saved: false, item: null });
    expect(prisma.savedItem.delete).toHaveBeenCalledWith({ where: { id: 42 } });
    expect(prisma.savedItem.upsert).not.toHaveBeenCalled();
  });

  it('quitar algo que no estaba no es un error', async () => {
    const prisma = makePrisma({
      savedItem: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    });
    await expect(
      new SavedItemService(prisma).remove(7, 'LESSON', 'l-1'),
    ).resolves.toEqual({
      removed: false,
    });
  });
});
