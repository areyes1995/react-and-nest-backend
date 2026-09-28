#!/bin/sh
# patch-migration.sh — parchea migration.sql para incluir CREATE EXTENSION vector
set -e
HEADER="-- pgvector required for document_chunks.embedding
CREATE EXTENSION IF NOT EXISTS vector;"
patch_file() {
  FILE="$1"
  [ ! -f "$FILE" ] && echo "⚠️ no existe $FILE" && return 1
  head -n 5 "$FILE" | grep -q "CREATE EXTENSION IF NOT EXISTS vector" && echo "✅ ya parcheado $FILE" && return 0
  grep -q "vector(1024)\|tsvector" "$FILE" || { echo "ℹ️ $FILE no usa vector"; return 0; }
  echo "==> parcheando $FILE"
  TMP=$(mktemp); printf "%s\n\n" "$HEADER" > "$TMP"; cat "$FILE" >> "$TMP"; mv "$TMP" "$FILE"; echo "✅ parcheado"
}
if [ -n "$1" ]; then patch_file "$1"; else LATEST=$(ls -1t prisma/migrations/*/migration.sql 2>/dev/null | head -n 1 || true); [ -z "$LATEST" ] && echo "⚠️ no hay migraciones" && exit 0; patch_file "$LATEST"; fi
