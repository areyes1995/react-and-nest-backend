// =============================================================================
// 🎭 ADMIN ROLE SEEDER — Asigna rol ADMIN a cuentas de administración
// =============================================================================
//
// Busca todos los SystemUser cuya email contenga "admin" y les asigna
// el rol ADMIN con todos sus permisos.
//
// ✅ IDEMPOTENTE — verifica existencia del rol y asignación previa.
//
// =============================================================================

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export async function seedAdminRoles(prisma: PrismaClient): Promise<void> {
  console.log('🎭  Seed de roles ADMIN...');

  // ── Buscar rol ADMIN ───────────────────────────────────────────
  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    console.log('  ⚠️  Rol ADMIN no existe. Ejecuta el seeder de roles primero.');
    return;
  }

  console.log(`  ℹ️  Rol ADMIN encontrado (id: ${adminRole.id})`);

  // ── Buscar usuarios admin ─────────────────────────────────────
  const adminUsers = await prisma.systemUser.findMany({
    where: {
      deletedAt: null,
          email: {
            contains: 'admin',
            mode: 'insensitive',
          },
        },
      });

      if (adminUsers.length === 0) {
        console.log('  ℹ️  No se encontraron usuarios admin.');
        console.log('  ℹ️  (Los emails con "admin" son candidatos a rol ADMIN)');
        return;
      }

      let assigned = 0;
      for (const user of adminUsers) {
        // ── Verificar si ya tiene rol ADMIN ──────────────────────
        const existing = await prisma.systemUserRole.findUnique({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: adminRole.id,
            },
          },
        });

        if (existing) {
          console.log(`  ℹ️  Usuario "${user.email}" ya tiene rol ADMIN. Omitido.`);
          continue;
        }

        // ── Eliminar otros roles existentes ─────────────────────
        await prisma.systemUserRole.deleteMany({
          where: { userId: user.id },
        });

        // ── Asignar rol ADMIN ──────────────────────────────────
        await prisma.systemUserRole.create({
          data: {
            userId: user.id,
            roleId: adminRole.id,
          },
        });

        assigned++;
        console.log(`  ✅  Rol ADMIN asignado a usuario "${user.email}" (id: ${user.id})`);
      }

      console.log(`\n  ✅  ${assigned} usuario(s) admin actualizado(s) con rol ADMIN.\n`);
    }
