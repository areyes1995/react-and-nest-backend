import { PagedResultDto } from '../dtos/paged-result.dto';

// ──────────────────────────────────────────────
// Prisma pagination + filter helper
//
// Generaliza la lógica repetida de paginar (skip/take/
// count) y traducir `filter` a un `where` de Prisma.
// Cada repository provee closures tipadas de su propio
// delegate y la config de filtros permitidos; el helper
// hace el resto.
// ──────────────────────────────────────────────

export type FilterType = 'string' | 'number' | 'boolean' | 'enum';

/** Transformer personalizado: recibe el valor y devuelve el fragmento de where a mezclar. */
export type FilterTransformer = (
  value: unknown,
) => Record<string, unknown> | null | undefined;

export type FilterSpec = FilterType | FilterTransformer;

export interface PaginationQueryLike {
  page?: number;
  pageSize?: number;
  filter?: Record<string, unknown>;
}

export interface PaginatePrismaArgs<TWhere, TFindManyArgs, TItem> {
  count: (args: { where: TWhere }) => PromiseLike<number>;
  findMany: (args: TFindManyArgs) => PromiseLike<TItem[]>;
  where: TWhere;
  findManyArgs: Omit<TFindManyArgs, 'where' | 'skip' | 'take'>;
  query: PaginationQueryLike;
  filterConfig?: Record<string, FilterSpec>;
}

/** Construye el `where` de Prisma a partir del objeto `filter` y la config de tipos. */
export function buildWhereFromFilters(
  filter: Record<string, unknown> | undefined,
  config: Record<string, FilterSpec> | undefined,
  baseWhere: Record<string, unknown> = {},
): Record<string, unknown> {
  const where = { ...baseWhere };

  if (!filter || !config) return where;

  for (const key in filter) {
    if (!(key in config)) continue;

    const value = filter[key];
    if (value === undefined || value === null || value === '') continue;

    const spec = config[key];

    if (typeof spec === 'function') {
      const fragment = spec(value);
      if (fragment) Object.assign(where, fragment);
      continue;
    }

    switch (spec) {
      case 'string':
        where[key] = { contains: value };
        break;
      case 'number': {
        const numberValue = Number(value);
        if (!Number.isNaN(numberValue)) where[key] = numberValue;
        break;
      }
      case 'boolean':
        where[key] = value === 'true' || value === true;
        break;
      case 'enum':
        where[key] = value;
        break;
    }
  }

  return where;
}

/** Normaliza y valida `page`/`pageSize`. */
export function resolvePagination(
  page?: number,
  pageSize?: number,
): { page: number; pageSize: number } {
  const pageValue = Math.max(Number(page) || 1, 1);
  const pageSizeValue = Number(pageSize) || 10;
  return { page: pageValue, pageSize: pageSizeValue };
}

/** Ejecuta count + findMany con paginación y filtros, devolviendo un PagedResultDto. */
export async function paginatePrisma<TWhere, TFindManyArgs, TItem>(
  args: PaginatePrismaArgs<TWhere, TFindManyArgs, TItem>,
): Promise<PagedResultDto<TItem>> {
  const { page, pageSize } = resolvePagination(
    args.query.page,
    args.query.pageSize,
  );

  const where = buildWhereFromFilters(
    args.query.filter,
    args.filterConfig,
    args.where as Record<string, unknown>,
  ) as TWhere;

  const findManyArgs = {
    ...args.findManyArgs,
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
  } as unknown as TFindManyArgs;

  const [totalItems, items] = await Promise.all([
    args.count({ where }),
    args.findMany(findManyArgs),
  ]);

  return {
    items,
    totalItems,
    page,
    pageSize,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}