#!/bin/sh
# setup-prisma-wrapper.sh — envuelve node_modules/.bin/prisma para que
# `pnpm prisma migrate dev` funcione a la primera con pgvector.
# - Antes de migrate: asegura vector en template1/postgres/verse (shadow DB hereda)
# - Después de migrate dev: parchea migration.sql con CREATE EXTENSION
# Se ejecuta en postinstall y puede re-ejecutarse manualmente.
set -e

BIN="node_modules/.bin/prisma"
REAL="node_modules/.bin/prisma.real"

if [ ! -f "$BIN" ]; then
  echo "⚠️ $BIN no existe (ejecuta pnpm install primero)"
  exit 0
fi

# Si ya está envuelto, no duplicar
if grep -q "prisma.real" "$BIN" 2>/dev/null; then
  echo "✅ wrapper ya instalado en $BIN"
  exit 0
fi

echo "==> Instalando wrapper pgvector en $BIN…"
cp "$BIN" "$REAL"

cat > "$BIN" <<'WRAPPER'
#!/bin/sh
# wrapper pgvector — generado por scripts/setup-prisma-wrapper.sh
# Asegura template1 y parchea migración para que `migrate dev` funcione a la primera
WRAPPER_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
REAL_BIN="$WRAPPER_DIR/node_modules/.bin/prisma.real"

# 1) Pre-hook: antes de migrate, asegurar vector en DBs (no falla si no hay DB)
case "$*" in
  *"migrate dev"*|*"migrate deploy"*|*"migrate reset"*)
    # template1 -> shadow DB heredará vector automáticamente
    PGPASS_TMP="${DATABASE_PASSWORD:-root}"
    PGPASS_TMP2="${PGPASSWORD:-$PGPASS_TMP}"
    export PGPASSWORD="$PGPASS_TMP2"
    # Cargar .env para host/port/user si existe
    if [ -f "$WRAPPER_DIR/.env" ]; then
      DB_HOST=$(grep -E "^DATABASE_HOST=" "$WRAPPER_DIR/.env" 2>/dev/null | tail -n1 | cut -d= -f2- | tr -d '"' | tr -d "'" || echo "localhost")
      DB_PORT=$(grep -E "^DATABASE_PORT=" "$WRAPPER_DIR/.env" 2>/dev/null | tail -n1 | cut -d= -f2- | tr -d '"' || echo "5432")
      DB_USER=$(grep -E "^DATABASE_USER=" "$WRAPPER_DIR/.env" 2>/dev/null | tail -n1 | cut -d= -f2- | tr -d '"' || echo "postgres")
      [ -z "$DB_HOST" ] && DB_HOST="localhost"
      [ -z "$DB_PORT" ] && DB_PORT="5432"
      [ -z "$DB_USER" ] && DB_USER="postgres"
    else
      DB_HOST="localhost"; DB_PORT="5432"; DB_USER="postgres"
    fi
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d template1 -c "CREATE EXTENSION IF NOT EXISTS vector;" >/dev/null 2>&1 || true
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE EXTENSION IF NOT EXISTS vector;" >/dev/null 2>&1 || true
    # también verse si existe
    if [ -f "$WRAPPER_DIR/scripts/ensure-pgvector.sh" ]; then
      sh "$WRAPPER_DIR/scripts/ensure-pgvector.sh" >/dev/null 2>&1 || true
    fi
    ;;
esac

# 2) Ejecutar prisma real
exec_prisma() {
  if [ -x "$REAL_BIN" ]; then
    exec "$REAL_BIN" "$@"
  else
    # fallback a node directo
    BASED=$(dirname "$0")
    exec node "$BASED/../prisma/build/index.js" "$@"
  fi
}

# Si es migrate dev necesitamos capturar exit y luego parchear
case "$*" in
  *"migrate dev"*)
    # Ejecutar y guardar exit
    set +e
    "$REAL_BIN" "$@"
    EXIT=$?
    set -e
    # Parchear la migración recién creada (si existe)
    if [ -f "$WRAPPER_DIR/scripts/patch-migration.sh" ]; then
      sh "$WRAPPER_DIR/scripts/patch-migration.sh" >/dev/null 2>&1 || true
    fi
    exit $EXIT
    ;;
  *)
    exec "$REAL_BIN" "$@"
    ;;
esac
WRAPPER

chmod +x "$BIN"
echo "✅ wrapper instalado"
