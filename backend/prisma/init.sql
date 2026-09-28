-- prisma/init.sql — usado por docker-entrypoint-initdb.d y por scripts/ensure-pgvector.sh
-- Postgres (no MySQL). Crea extensiones requeridas antes de migraciones.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
