// ──────────────────────────────────────────────
// Auth Mocks — Datos falsos para desarrollo
// Soporta: db (base de datos) y ldap
// ──────────────────────────────────────────────

export interface MockUser {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  role: string
  permissions?: string[]
  isActive?: boolean
  avatarUrl?: string
}

// ─── Permisos por rol (espejo de roles.constants.ts del backend) ───

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['module:records', 'module:coaching', 'module:vacations', 'module:sales', 'module:licenses', 'module:permissions', 'rag:upload-view', 'rag:upload', 'metrics:read', 'metrics:export'],
  EXHIBITOR: ['module:records', 'rag:read', 'rag:search', 'notification:read', 'notification:update', 'metrics:read', 'metrics:export'],
  BUSINESS: ['module:records', 'rag:read', 'rag:search', 'notification:read', 'metrics:read'],
  GUEST: ['module:records', 'rag:read', 'rag:search', 'notification:read'],
}

interface MockSession {
  user: MockUser
  token: string
  expiresAt: string
  ldapAttributes?: Record<string, unknown>
}

// ─── Usuarios DB (base de datos local) ───────

const DB_USERS: Array<{ email: string; password: string; user: MockUser }> = [
  {
    email: 'admin@uapaverse.com',
    password: 'admin123',
    user: {
      id: 'u-001',
      email: 'admin@uapaverse.com',
      name: 'Admin Uapaverse',
      role: 'ADMIN',
      permissions: ROLE_PERMISSIONS.ADMIN,
      isActive: true,
    },
  },
  {
    email: 'docente@uapaverse.com',
    password: 'docente123',
    user: {
      id: 'u-002',
      email: 'docente@uapaverse.com',
      name: 'María García',
      role: 'GUEST',
      permissions: ROLE_PERMISSIONS.GUEST,
      isActive: true,
    },
  },
  {
    email: 'director@uapaverse.com',
    password: 'director123',
    user: {
      id: 'u-003',
      email: 'director@uapaverse.com',
      name: 'Carlos López',
      role: 'ADMIN',
      permissions: ROLE_PERMISSIONS.ADMIN,
      isActive: true,
    },
  },
]

// ─── Usuarios LDAP (directorio activo) ───────

const LDAP_USERS: Array<{ email: string; password: string; user: MockUser }> = [
  {
    email: import.meta.env.VITE_LDAP_MOCK_USER1 || 'admin@uapaverse.edu',
    password: import.meta.env.VITE_LDAP_MOCK_PASS1 || 'Admin123!',
    user: {
      id: 'ldap-u-001',
      email: import.meta.env.VITE_LDAP_MOCK_USER1 || 'admin@uapaverse.edu',
      name: 'Admin LDAP',
      role: 'ADMIN',
      permissions: ROLE_PERMISSIONS.ADMIN,
      isActive: true,
    },
  },
  {
    email: import.meta.env.VITE_LDAP_MOCK_USER2 || 'maria.garcia@uapaverse.edu',
    password: import.meta.env.VITE_LDAP_MOCK_PASS2 || 'Maria2025!',
    user: {
      id: 'ldap-u-002',
      email: import.meta.env.VITE_LDAP_MOCK_USER2 || 'maria.garcia@uapaverse.edu',
        name: 'María García LDAP',
        role: 'GUEST',
        permissions: ROLE_PERMISSIONS.GUEST,
      isActive: true,
    },
  },
  {
    email: import.meta.env.VITE_LDAP_MOCK_USER3 || 'carlos.lopez@uapaverse.edu',
    password: import.meta.env.VITE_LDAP_MOCK_PASS3 || 'Carlos2025!',
    user: {
      id: 'ldap-u-003',
      email: import.meta.env.VITE_LDAP_MOCK_USER3 || 'carlos.lopez@uapaverse.edu',
      name: 'Carlos López LDAP',
      role: 'ADMIN',
      permissions: ROLE_PERMISSIONS.ADMIN,
      isActive: true,
    },
  },
]

// ─── Helpers ─────────────────────────────────

function generateToken(user: MockUser): string {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    source: user.email.includes('@uapaverse.edu') ? 'ldap' : 'db',
    iat: Math.floor(Date.now() / 1000),
    exp:
      Math.floor(Date.now() / 1000) +
      60 * Number(import.meta.env.VITE_TOKEN_EXPIRY_MINUTES || 60),
  }
  const secret = import.meta.env.VITE_MOCK_SECRET || 'uapaverse-dev-secret-2025'
  return `mock.${btoa(JSON.stringify(payload))}.${btoa(secret)}`
}

function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || parts[0] !== 'mock') return null
    return JSON.parse(atob(parts[1]))
  } catch {
    return null
  }
}

function isTokenExpired(payload: Record<string, unknown>): boolean {
  const exp = payload.exp as number
  return Date.now() / 1000 > exp
}

// ─── Mock Login (DB) ─────────────────────────

export function mockLogin(credentials: {
  email: string
  password: string
}): Promise<MockSession> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const normalizedEmail = credentials.email.trim().toLowerCase()
      const found = DB_USERS.find(
        u => u.email.toLowerCase() === normalizedEmail && u.password === credentials.password,
      )

      if (!found) {
        reject(new Error('Credenciales inválidas'))
        return
      }

      const token = generateToken(found.user)
      const expiresAt = new Date(
        Date.now() +
          Number(import.meta.env.VITE_TOKEN_EXPIRY_MINUTES || 60) * 60 * 1000,
      ).toISOString()

      resolve({ user: found.user, token, expiresAt })
    }, 600)
  })
}

// ─── Mock Login (LDAP) ───────────────────────

export function mockLdapLogin(credentials: {
  email: string
  password: string
}): Promise<MockSession> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const normalizedEmail = credentials.email.trim().toLowerCase()
      // Extraer dominio del email para validación
      const domain = normalizedEmail.split('@')[1]?.toLowerCase()
      const expectedDomain = (
        import.meta.env.VITE_LDAP_DOMAIN || 'uapaverse.edu'
      ).toLowerCase()
      const allowAnyDomain = (
        import.meta.env.VITE_LDAP_ALLOW_ANY_DOMAIN || 'false'
      ).toLowerCase()

      // Validar que el dominio coincida con el LDAP configurado
      if (allowAnyDomain !== 'true' && domain !== expectedDomain) {
        reject(
          new Error(
            `Dominio no autorizado. Use su cuenta @${expectedDomain}`,
          ),
        )
        return
      }

      const found = LDAP_USERS.find(
        u => u.email.toLowerCase() === normalizedEmail && u.password === credentials.password,
      )

      if (!found) {
        reject(new Error('Credenciales LDAP inválidas'))
        return
      }

      const token = generateToken(found.user)
      const expiresAt = new Date(
        Date.now() +
          Number(import.meta.env.VITE_TOKEN_EXPIRY_MINUTES || 60) * 60 * 1000,
      ).toISOString()

      resolve({
        user: found.user,
        token,
        expiresAt,
        // Simular atributos LDAP adicionales
        ldapAttributes: {
          dn: `cn=${found.user.name.split(' ')[0]},ou=usuarios,${import.meta.env.VITE_LDAP_BASE_DN || 'dc=uapaverse,dc=edu'}`,
          memberOf: ['CN=Docentes,OU=Grupos,DC=uapaverse,DC=edu'],
        },
      })
    }, 800) // LDAP suele ser un poco más lento
  })
}

// ─── Mock Validate Token ─────────────────────

export function mockValidateToken(token: string): Promise<MockUser> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const payload = decodeToken(token)
      if (!payload) {
        reject(new Error('Token inválido'))
        return
      }

      if (isTokenExpired(payload)) {
        reject(new Error('Token expirado'))
        return
      }

      const user: MockUser = {
        id: payload.sub as string,
        email: payload.email as string,
        name: payload.name as string,
        role: payload.role as string,
        permissions: ROLE_PERMISSIONS[payload.role as string] ?? [],
        isActive: true,
      }

      resolve(user)
    }, 300)
  })
}

export { DB_USERS, LDAP_USERS }