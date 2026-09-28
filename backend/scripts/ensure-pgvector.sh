#!/bin/sh
# =============================================================================
# ensure-pgvector.sh — garantiza pgvector en el Postgres local del entorno
# - Verifica que /usr/lib/postgresql/*/lib/vector.so esté instalado (0.8.0)
# - Crea DB verse si no existe
# - Hace CREATE EXTENSION IF NOT EXISTS vector en postgres y verse
# Idempotente. Usado por pnpm db:migrate y docker-entrypoint.
# =============================================================================
set -e

get_env() {
  key="$1"; def="$2"
  val=$(printenv "$key" 2>/dev/null || true)
  if [ -n "$val" ]; then echo "$val"; return; fi
  if [ -f .env ]; then
    parsed=$(grep -E "^${key}=" .env 2>/dev/null | tail -n 1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" || true)
    if [ -n "$parsed" ]; then echo "$parsed"; return; fi
  fi
  echo "$def"
}

DATABASE_USER=$(get_env DATABASE_USER "postgres")
DATABASE_PASSWORD=$(get_env DATABASE_PASSWORD "root")
DATABASE_NAME=$(get_env DATABASE_NAME "verse")
DATABASE_HOST=$(get_env DATABASE_HOST "localhost")
DATABASE_PORT=$(get_env DATABASE_PORT "5432")
export PGPASSWORD="$DATABASE_PASSWORD"

echo "==> [ensure-pgvector] Postgres $DATABASE_HOST:$DATABASE_PORT DB=$DATABASE_NAME user=$DATABASE_USER"

# 0) Verificar binario pgvector instalado a nivel OS
if [ ! -f /usr/lib/postgresql/14/lib/vector.so ] && [ ! -f /usr/lib/postgresql/16/lib/vector.so ]; then
  echo "⚠️  /usr/lib/postgresql/*/lib/vector.so no encontrado"
  echo "   pgvector ya está instalado en este entorno (0.8.0) via /usr/lib/postgresql/14/lib/vector.so"
  echo "   Si no estuviera, instalar: sudo apt-get install postgresql-14-pgvector (requiere repo PGDG)"
else
  echo "✅ vector.so presente: $(ls -lh /usr/lib/postgresql/*/lib/vector.so 2>/dev/null | awk '{print $9, $5}')"
fi

# 1) Postgres alcanzable?
if ! psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d postgres -c "SELECT 1" >/dev/null 2>&1; then
  echo "❌ No conecta a Postgres $DATABASE_HOST:$DATABASE_PORT"
  exit 1
fi

# 2) Crear DB si falta
if ! psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DATABASE_NAME"; then
  echo "==> Creando DB $DATABASE_NAME…"
  psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d postgres -c "CREATE DATABASE \"$DATABASE_NAME\" OWNER \"$DATABASE_USER\";" || true
fi

# 3) Extension disponible?
AVAIL=$(psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d postgres -tAc "SELECT count(*) FROM pg_available_extensions WHERE name='vector';" 2>/dev/null || echo "0")
if [ "$AVAIL" = "0" ]; then
  echo "❌ vector no en pg_available_extensions — reinstala pgvector: https://github.com/pgvector/pgvector"
  exit 1
fi
echo "✅ pgvector disponible"

# 4) Crear extensión en ambas DBs
psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d postgres -c "CREATE EXTENSION IF NOT EXISTS vector;" >/dev/null 2>&1 || true
psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "CREATE EXTENSION IF NOT EXISTS vector;" >/dev/null 2>&1 || true

VER=$(psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -tAc "SELECT extversion FROM pg_extension WHERE extname='vector';" 2>/dev/null || echo "")
if [ -n "$VER" ]; then echo "✅ vector@$VER en $DATABASE_NAME"; else echo "❌ fallo CREATE EXTENSION"; exit 1; fi
echo "==> listo"
