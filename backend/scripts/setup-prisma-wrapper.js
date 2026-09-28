#!/usr/bin/env node
// setup-prisma-wrapper.js — cross-platform port of setup-prisma-wrapper.sh
// - Linux/macOS: wraps node_modules/.bin/prisma to ensure pgvector + patch migration
// - Windows: .bin/prisma is a .cmd/.ps1, wrapping as shell script makes no sense -> skip gracefully
// Always exits 0 so postinstall never fails (equivalent of `|| true`).
'use strict';

const fs = require('fs');
const path = require('path');

function main() {
  try {
    const root = path.resolve(__dirname, '..');
    const bin = path.join(root, 'node_modules', '.bin', 'prisma');
    const real = path.join(root, 'node_modules', '.bin', 'prisma.real');

    if (process.platform === 'win32') {
      console.log('ℹ️ Windows detectado: se omite el wrapper pgvector de prisma (solo necesario en Linux/macOS).');
      return 0;
    }

    if (!fs.existsSync(bin)) {
      console.log('⚠️ node_modules/.bin/prisma no existe (ejecuta pnpm install primero)');
      return 0;
    }

    try {
      const content = fs.readFileSync(bin, 'utf8');
      if (content.includes('prisma.real')) {
        console.log(`✅ wrapper ya instalado en ${bin}`);
        return 0;
      }
    } catch {
      // si no se puede leer, continuar con la instalación
    }

    console.log(`==> Instalando wrapper pgvector en ${bin}…`);
    fs.copyFileSync(bin, real);

    const wrapper = `#!/bin/sh
# wrapper pgvector — generado por scripts/setup-prisma-wrapper.js
# Asegura template1 y parchea migración para que \`migrate dev\` funcione a la primera
WRAPPER_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
REAL_BIN="$WRAPPER_DIR/node_modules/.bin/prisma.real"

# 1) Pre-hook: antes de migrate, asegurar vector en DBs (no falla si no hay DB)
case "$*" in
  *"migrate dev"*|*"migrate deploy"*|*"migrate reset"*)
    # template1 -> shadow DB heredará vector automáticamente
    PGPASS_TMP="\${DATABASE_PASSWORD:-root}"
    PGPASS_TMP2="\${PGPASSWORD:-$PGPASS_TMP}"
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
`;
    fs.writeFileSync(bin, wrapper, { mode: 0o755 });
    // chmod explícito por si el mode de writeFile no aplica (Windows/umask)
    try {
      fs.chmodSync(bin, 0o755);
    } catch {
      // ignorar
    }
    console.log('✅ wrapper instalado');
    return 0;
  } catch (err) {
    console.warn('⚠️ no se pudo instalar el wrapper pgvector:', err && err.message ? err.message : err);
    return 0; // nunca romper postinstall
  }
}

process.exit(main());
