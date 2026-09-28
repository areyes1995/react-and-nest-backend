// =============================================================================
// 🌱 MAIN SEEDER — Punto de entrada para los seeders de la base de datos
// =============================================================================

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { seedRoles } from './roles.seeder';

const databaseUrl = process.env.DATABASE_URL ?? '';
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱  Iniciando seeders...\n');

  // ── Seeders de roles RBAC ────────────────────────────────────────────
  await seedRoles(prisma);

  console.log('\n✅  Todos los seeders ejecutados correctamente.');
}

main()
  .catch((err) => {
    console.error('\n❌  Error ejecutando seeders:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
