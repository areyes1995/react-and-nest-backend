#!/usr/bin/env node
// migrate-dev.js — cross-platform port of migrate-dev.sh
// ensure pgvector -> prisma migrate dev -> patch
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

function run(cmd, args, extraEnv) {
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, ...extraEnv },
  });
  return r.status ?? 1;
}

const root = path.resolve(__dirname, '..');
console.log('==> ensure pgvector…');
let code = run('node', [path.join(root, 'scripts', 'ensure-pgvector.js')]);
if (code !== 0) process.exit(code);

console.log(`==> prisma migrate dev ${process.argv.slice(2).join(' ')}`);
// pnpm en Windows es pnpm.cmd; con shell:true se resuelve bien
code = run(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['prisma', 'migrate', 'dev', ...process.argv.slice(2)]);
if (code !== 0) process.exit(code);

console.log('==> patch');
code = run('node', [path.join(root, 'scripts', 'patch-migration.js')]);
process.exit(code);
