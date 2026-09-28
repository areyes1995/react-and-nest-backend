#!/usr/bin/env node
// patch-migration.js — cross-platform port of patch-migration.sh
// Parchea migration.sql para incluir CREATE EXTENSION vector
'use strict';

const fs = require('fs');
const path = require('path');

const HEADER = `-- pgvector required for document_chunks.embedding
CREATE EXTENSION IF NOT EXISTS vector;`;

function patchFile(file) {
  if (!fs.existsSync(file)) {
    console.log(`⚠️ no existe ${file}`);
    return false;
  }
  const content = fs.readFileSync(file, 'utf8');
  const head = content.split('\n').slice(0, 5).join('\n');
  if (head.includes('CREATE EXTENSION IF NOT EXISTS vector')) {
    console.log(`✅ ya parcheado ${file}`);
    return true;
  }
  if (!content.includes('vector(1024)') && !content.includes('tsvector')) {
    console.log(`ℹ️ ${file} no usa vector`);
    return true;
  }
  console.log(`==> parcheando ${file}`);
  fs.writeFileSync(file, `${HEADER}\n\n${content}`);
  console.log('✅ parcheado');
  return true;
}

function findLatest() {
  const root = path.resolve(__dirname, '..');
  const dir = path.join(root, 'prisma', 'migrations');
  if (!fs.existsSync(dir)) return null;
  let latest = null;
  let latestMtime = -1;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(dir, entry.name, 'migration.sql');
    if (!fs.existsSync(candidate)) continue;
    const mtime = fs.statSync(candidate).mtimeMs;
    if (mtime > latestMtime) {
      latestMtime = mtime;
      latest = candidate;
    }
  }
  return latest;
}

function main() {
  const arg = process.argv[2];
  if (arg) {
    const root = path.resolve(__dirname, '..');
    patchFile(path.isAbsolute(arg) ? arg : path.join(root, arg));
    return;
  }
  const latest = findLatest();
  if (!latest) {
    console.log('⚠️ no hay migraciones');
    return;
  }
  patchFile(latest);
}

main();
