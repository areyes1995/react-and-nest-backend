import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  PERMISSIONS,
  RESOURCES,
} from '../../src/modules/auth/constants/permissions.constants';
import { ROLE_DEFINITIONS } from '../../src/modules/auth/constants/roles.constants';

export async function seedRoles(prisma: PrismaClient): Promise<void> {
  console.log('🔐  Seed de roles RBAC...\n');

  // ── Recursos ────────────────────────────────────────
  const resourceIds = new Map<string, number>();
  for (const resource of RESOURCES) {
    const created = await prisma.resource.upsert({
      where: { name: resource.name },
      update: { description: resource.description },
      create: resource,
    });
    resourceIds.set(resource.name, created.id);
    console.log(`  ✅  Recurso "${created.name}" insertado/actualizado`);
  }
  console.log('');

  // ── Permisos ────────────────────────────────────────
  const permissionIds = new Map<string, number>();
  for (const permission of PERMISSIONS) {
    const resourceId = resourceIds.get(permission.resource);
    if (!resourceId) {
      throw new Error(
        `Recurso "${permission.resource}" no encontrado para "${permission.name}"`,
      );
    }
    const created = await prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        description: permission.description,
        resourceId,
      },
      create: {
        name: permission.name,
        description: permission.description,
        resourceId,
      },
    });
    permissionIds.set(permission.name, created.id);
    console.log(`  ✅  Permiso "${created.name}" insertado/actualizado`);
  }
  console.log('');

  // ── Roles ───────────────────────────────────────────
  for (const definition of ROLE_DEFINITIONS) {
    const created = await prisma.role.upsert({
      where: { name: definition.name },
      update: {
        description: definition.description,
        isActive: true,
      },
      create: {
        name: definition.name,
        description: definition.description,
        isActive: true,
      },
    });

    // ── Asignación de permisos al rol ────────────────
    let assigned = 0;
    for (const permissionName of definition.permissions) {
      const permissionId = permissionIds.get(permissionName);
      if (!permissionId) {
        throw new Error(
          `Permiso "${permissionName}" no encontrado para rol "${definition.name}"`,
        );
      }
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: created.id, permissionId } },
        update: {},
        create: { roleId: created.id, permissionId },
      });
      assigned += 1;
    }

    // ── Sincronización: elimina permisos del rol que ya no
    //    están en la definición (evita quedarse con asignaciones
    //    obsoletas entre ejecuciones del seed).
    const assignedIds = definition.permissions
      .map((name) => permissionIds.get(name))
      .filter((id): id is number => id !== undefined);
    if (assignedIds.length > 0) {
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: created.id,
          permissionId: { notIn: assignedIds },
        },
      });
    }

    console.log(
      `  ✅  Rol "${created.name}" insertado/actualizado (${assigned} permisos)`,
    );
  }

  // ── Migración + limpieza de roles obsoletos ──
  // Los roles válidos son los de ROLE_DEFINITIONS (SUPERADMIN,
  // ADMIN, EXHIBITOR, BUSINESS, GUEST). Los usuarios de roles
  // antiguos se migran según ROLE_MIGRATIONS antes de borrarlos;
  // cualquier otro rol fuera de catálogo se elimina con sus
  // asignaciones (rolePermission + systemUserRole).
  const validNames = new Set<string>(ROLE_DEFINITIONS.map((d) => d.name));

  const ROLE_MIGRATIONS: Record<string, string> = {
    BASIC: 'GUEST',
    EXPOSITOR: 'EXHIBITOR',
    EMPRESARIAL: 'BUSINESS',
    INVITADO: 'GUEST',
  };
  for (const [from, to] of Object.entries(ROLE_MIGRATIONS)) {
    const fromRole = await prisma.role.findUnique({ where: { name: from } });
    const toRole = await prisma.role.findUnique({ where: { name: to } });
    if (!fromRole || !toRole) continue;
    const holders = await prisma.systemUserRole.findMany({
      where: { roleId: fromRole.id },
      select: { userId: true },
    });
    for (const holder of holders) {
      await prisma.systemUserRole.upsert({
        where: {
          userId_roleId: { userId: holder.userId, roleId: toRole.id },
        },
        update: {},
        create: { userId: holder.userId, roleId: toRole.id },
      });
    }
    if (holders.length > 0) {
      console.log(
        `  ♻️  ${holders.length} usuario(s) migrados de ${from} a ${to}`,
      );
    }
  }

  const staleRoles = await prisma.role.findMany({
    where: { name: { notIn: [...validNames] } },
    select: { id: true, name: true },
  });
  for (const stale of staleRoles) {
    await prisma.rolePermission.deleteMany({ where: { roleId: stale.id } });
    await prisma.systemUserRole.deleteMany({ where: { roleId: stale.id } });
    await prisma.role.delete({ where: { id: stale.id } });
    console.log(`  🗑️  Rol obsoleto "${stale.name}" eliminado`);
  }
  if (staleRoles.length === 0) {
    console.log('  ✅  Sin roles obsoletos');
  }

  console.log('\n  ✅  Seed de roles RBAC completado.\n');
}
