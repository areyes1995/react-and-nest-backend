#!/bin/sh
# Wrapper migrate dev: ensure pgvector -> migrate dev -> patch
set -e
echo "==> ensure pgvector…"; sh scripts/ensure-pgvector.sh
echo "==> prisma migrate dev $@"; pnpm prisma migrate dev "$@"
echo "==> patch"; sh scripts/patch-migration.sh
echo "==> listo"
