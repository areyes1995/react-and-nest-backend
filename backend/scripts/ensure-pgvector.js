#!/usr/bin/env node
// ensure-pgvector.js — cross-platform port of ensure-pgvector.sh
// Garantiza pgvector en el Postgres local usando el driver `pg` (sin depender de psql CLI).
'use strict';

const fs = require('fs');
const path = require('path');

function loadDotEnv(root) {
  const env = {};
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in env)) env[key] = val;
  }
  return env;
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const fileEnv = loadDotEnv(root);
  const get = (k, def) => process.env[k] ?? fileEnv[k] ?? def;

  const DATABASE_USER = get('DATABASE_USER', 'postgres');
  const DATABASE_PASSWORD = get('DATABASE_PASSWORD', 'root');
  const DATABASE_NAME = get('DATABASE_NAME', 'verse');
  const DATABASE_HOST = get('DATABASE_HOST', 'localhost');
  const DATABASE_PORT = Number(get('DATABASE_PORT', '5432'));

  console.log(`==> [ensure-pgvector] Postgres ${DATABASE_HOST}:${DATABASE_PORT} DB=${DATABASE_NAME} user=${DATABASE_USER}`);

  let pg;
  try {
    pg = require('pg');
  } catch {
    console.error('❌ falta dependencia `pg`. Ejecuta pnpm install primero.');
    process.exit(1);
  }

  const admin = new pg.Client({
    host: DATABASE_HOST,
    port: DATABASE_PORT,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: 'postgres',
    connectionTimeoutMillis: 5000,
  });

  try {
    await admin.connect();
  } catch (err) {
    console.error(`❌ No conecta a Postgres ${DATABASE_HOST}:${DATABASE_PORT}: ${err.message}`);
    process.exit(1);
  }

  try {
    // Crear DB si falta (identificadores entre comillas para evitar inyección básica)
    const dbExists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [DATABASE_NAME]);
    if (dbExists.rowCount === 0) {
      console.log(`==> Creando DB ${DATABASE_NAME}…`);
      await admin.query(`CREATE DATABASE "${DATABASE_NAME.replace(/"/g, '""')}" OWNER "${DATABASE_USER.replace(/"/g, '""')}"`);
    }

    const avail = await admin.query("SELECT count(*)::int AS c FROM pg_available_extensions WHERE name='vector'");
    if (!avail.rows[0] || avail.rows[0].c === 0) {
      console.error('❌ vector no en pg_available_extensions — reinstala pgvector: https://github.com/pgvector/pgvector');
      process.exit(1);
    }
    console.log('✅ pgvector disponible');

    await admin.query('CREATE EXTENSION IF NOT EXISTS vector;');
    await admin.end();

    const app = new pg.Client({
      host: DATABASE_HOST,
      port: DATABASE_PORT,
      user: DATABASE_USER,
      password: DATABASE_PASSWORD,
      database: DATABASE_NAME,
      connectionTimeoutMillis: 5000,
    });
    await app.connect();
    await app.query('CREATE EXTENSION IF NOT EXISTS vector;');
    const ver = await app.query("SELECT extversion FROM pg_extension WHERE extname='vector'");
    await app.end();

    if (ver.rowCount > 0) {
      console.log(`✅ vector@${ver.rows[0].extversion} en ${DATABASE_NAME}`);
    } else {
      console.error('❌ fallo CREATE EXTENSION');
      process.exit(1);
    }
    console.log('==> listo');
  } catch (err) {
    console.error(`❌ ensure-pgvector falló: ${err.message}`);
    try {
      await admin.end();
    } catch {
      // ignorar
    }
    process.exit(1);
  }
}

main();
