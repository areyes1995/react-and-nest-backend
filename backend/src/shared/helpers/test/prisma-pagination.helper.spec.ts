import {
  buildWhereFromFilters,
  paginatePrisma,
  resolvePagination,
} from 'src/shared/helpers/prisma-pagination.helper';

describe('prisma-pagination.helper', () => {
  describe('buildWhereFromFilters', () => {
    it('retorna baseWhere si no hay filter ni config', () => {
      expect(buildWhereFromFilters(undefined, undefined, { a: 1 })).toEqual({
        a: 1,
      });
    });

    it('ignora claves no configuradas y valores vacíos', () => {
      const where = buildWhereFromFilters(
        { name: 'x', hack: 'y', empty: '', nil: null, undef: undefined },
        { name: 'string' },
        {},
      );
      expect(where).toEqual({ name: { contains: 'x' } });
    });

    it('string → contains', () => {
      expect(buildWhereFromFilters({ q: 'abc' }, { q: 'string' })).toEqual({
        q: { contains: 'abc' },
      });
    });

    it('number → Number() e ignora NaN', () => {
      expect(buildWhereFromFilters({ n: '42' }, { n: 'number' })).toEqual({
        n: 42,
      });
      expect(buildWhereFromFilters({ n: 'nan!' }, { n: 'number' })).toEqual({});
    });

    it('boolean → true con "true" o true', () => {
      expect(
        buildWhereFromFilters({ b: 'true' }, { b: 'boolean' }),
      ).toEqual({ b: true });
      expect(buildWhereFromFilters({ b: true }, { b: 'boolean' })).toEqual({
        b: true,
      });
      expect(
        buildWhereFromFilters({ b: 'false' }, { b: 'boolean' }),
      ).toEqual({ b: false });
    });

    it('enum → valor directo', () => {
      expect(
        buildWhereFromFilters({ s: 'ACTIVO' }, { s: 'enum' }),
      ).toEqual({ s: 'ACTIVO' });
    });

    it('transformer → merge del fragmento', () => {
      const where = buildWhereFromFilters(
        { search: 'hola' },
        { search: (v) => ({ OR: [{ title: { contains: v } }] }) },
      );
      expect(where).toEqual({ OR: [{ title: { contains: 'hola' } }] });
    });

    it('transformer que retorna null no mezcla nada', () => {
      expect(
        buildWhereFromFilters({ x: '1' }, { x: () => null }),
      ).toEqual({});
    });
  });

  describe('resolvePagination', () => {
    it('defaults page=1 pageSize=10', () => {
      expect(resolvePagination(undefined, undefined)).toEqual({
        page: 1,
        pageSize: 10,
      });
    });

    it('page 0 / NaN → 1', () => {
      expect(resolvePagination(0, 5)).toEqual({ page: 1, pageSize: 5 });
      expect(resolvePagination(NaN, NaN)).toEqual({ page: 1, pageSize: 10 });
    });
  });

  describe('paginatePrisma', () => {
    it('calcula skip/take y totalPages', async () => {
      const count = jest.fn().mockResolvedValue(25);
      const findMany = jest.fn().mockResolvedValue([1, 2, 3]);
      const res = await paginatePrisma({
        count,
        findMany,
        where: {},
        findManyArgs: { orderBy: { id: 'asc' } } as any,
        query: { page: 2, pageSize: 10 },
      });
      expect(count).toHaveBeenCalledWith({ where: {} });
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(res).toEqual({
        items: [1, 2, 3],
        totalItems: 25,
        page: 2,
        pageSize: 10,
        totalPages: 3,
      });
    });

    it('aplica filtros al where', async () => {
      const count = jest.fn().mockResolvedValue(0);
      const findMany = jest.fn().mockResolvedValue([]);
      await paginatePrisma({
        count,
        findMany,
        where: { tenant: 1 },
        findManyArgs: {} as any,
        query: { filter: { name: 'a' } } as any,
        filterConfig: { name: 'string' },
      });
      expect(count).toHaveBeenCalledWith({
        where: { tenant: 1, name: { contains: 'a' } },
      });
    });
  });
});
