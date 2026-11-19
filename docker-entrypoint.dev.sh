#!/bin/sh
# Educraft XYZ — entrypoint de desarrollo (un solo contenedor: API + web).
# Instala deps del workspace, prepara Prisma/Postgres y arranca
# backend y frontend juntos con hot-reload.
set -e

apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

corepack enable
corepack prepare pnpm@10.2.0 --activate

cd /app
pnpm install --frozen-lockfile

cd /app/backend
pnpm prisma generate

echo "==> Asegurando pgvector…"
node scripts/ensure-pgvector.js || echo "⚠️ ensure-pgvector falló"

if [ -n "$PRISMA_ROLLBACK_FAILED" ]; then
  for m in $PRISMA_ROLLBACK_FAILED; do
    echo "==> Marcando migracion fallida como rolled-back: $m"
    pnpm prisma migrate resolve --rolled-back "$m" || true
  done
fi

echo "==> Aplicando esquema de base de datos…"
if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  pnpm prisma migrate deploy
else
  echo "==> No hay migraciones versionadas; usando prisma db push…"
  pnpm prisma db push
fi

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
  echo "==> Ejecutando seeders (RUN_SEEDERS=true)…"
  pnpm run db:seed || echo "⚠️ seeders fallaron"
fi

echo "==> Arrancando API (:3000) + frontend (:5173) en el mismo contenedor…"
cd /app
exec pnpm run dev
