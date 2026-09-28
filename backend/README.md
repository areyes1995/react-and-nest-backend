# Uapaverse Backend

API NestJS 11 + Prisma 7 + Postgres 16 + Redis 7 + BullMQ.
Prefijo global `/api/v1` (ver `src/main.ts`).

- Local: API → http://localhost:3000/api/v1 · Swagger → http://localhost:3000/api · Health → http://localhost:3000/api/v1/health
- Docker dev: API → http://localhost:4000/api/v1 (el contenedor expone el `3000` como `4000`)

## Requisitos

- Node.js 22+ y pnpm 10.2.0 (`corepack prepare pnpm@10.2.0 --activate`)
- Postgres 16 **con pgvector** y Redis 7 (o Docker, recomendado)
- Puertos libres: `3000` (API), `5432` (Postgres), `6379` (Redis)

> Los compose (`backend/docker-compose.yml`, raíz y prod) usan la imagen
> `pgvector/pgvector:pg16`, que ya trae la extensión `vector` que exige la
> migración (`CREATE EXTENSION IF NOT EXISTS vector` + columna
> `vector(1024)` en `document_chunks`). La imagen oficial `postgres:16`
> NO la trae y falla con `ERROR: extension "vector" is not available`
> (código `0A000`).
> Si usas Postgres instalado en tu PC (Forma 1 sin Docker), instala pgvector
> tú: https://github.com/pgvector/pgvector — en Windows lo más fácil es usar
> el instalador de PostgreSQL + la extensión, o WSL/Docker solo para la BD.

## Configuración (.env)

```powershell
Copy-Item .env.example .env
```

Mínimo necesario en desarrollo:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/uapaverse"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_dev_password
SECRET_PASSPORT=un-secreto-largo-para-dev
PORT=3000
```

> Con Docker el compose **sobrescribe** `DATABASE_URL` (`@postgres:5432`) y
> `REDIS_HOST=redis` sin modificar tu `.env`. En local con pnpm sí se usa tu
> `DATABASE_URL` tal cual (normalmente `@localhost:5432`).

## Forma 1 — Desarrollo local con pnpm (más rápido)

Necesitas Postgres + Redis. Si no los tienes instalados, levanta solo la
infra del compose raíz o de este proyecto:

```powershell
# Opción A: infra desde la raíz (recomendado en monorepo)
Set-Location ..
docker compose up postgres redis -d
Set-Location backend

# Opción B: infra de este proyecto
# docker compose up postgres redis -d

pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
pnpm db:seed              # opcional, datos iniciales
pnpm run start:dev        # http://localhost:3000/api/v1 (recarga con ts-node-dev)
```

## Forma 2 — Desarrollo con Docker (recomendado, todo incluido)

Levanta API con recarga en caliente + Postgres + Redis:

```powershell
Copy-Item .env.example .env   # revisa DATABASE_USER/PASSWORD/NAME y REDIS_PASSWORD
docker compose up --build
# API → http://localhost:4000/api/v1
# Postgres → localhost:5432 · Redis → localhost:6379
```

Variantes:

```powershell
docker compose up --build -d        # en segundo plano
docker compose up postgres redis -d # solo infra, código con pnpm
docker compose logs -f api          # ver logs de Nest
docker compose restart api          # reiniciar tras cambiar .env o schema
docker compose down                 # apagar
docker compose down -v              # apagar y BORRAR datos de la BD
```

También puedes levantarlo desde la raíz del monorepo (mismo resultado):

```powershell
Set-Location ..
docker compose up --build backend postgres redis
```

El servicio `api` usa el entrypoint `docker-entrypoint.dev.sh`, que hace
automáticamente:
`pnpm install → prisma generate → prisma migrate deploy → start:dev`
(con `RUN_SEEDERS=true` además corre `db:seed`).

## Forma 2b — Dev con seeders automáticos (desde la raíz)

El compose `docker-compose.dev.yml` (en la raíz) levanta Postgres + Redis +
backend + frontend y corre los seeders solos al arrancar:

```powershell
Set-Location ..
docker compose -f docker-compose.dev.yml up --build
# API → http://localhost:4000/api/v1 (con hot reload + seed)

# Re-correr seeders sin reiniciar:
docker compose -f docker-compose.dev.yml exec backend pnpm run db:seed
```

## Forma 3 — Producción con Docker

```powershell
docker build -t uapaverse-backend .
docker run --env-file .env -p 3000:3000 uapaverse-backend
# API → http://localhost:3000/api/v1
```

La imagen aplica `prisma generate + prisma migrate deploy` al arrancar y luego
corre el código compilado (`node dist/src/main.js`).

## Forma 4 — Compilado local (sin Docker, modo prod)

```powershell
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
pnpm build            # nest build → dist/src
pnpm run start:prod   # node dist/src/main (SIN recarga)
```

Otros scripts:

```powershell
pnpm run start           # nest start (una vez, sin watch)
pnpm run start:debug     # nest start --debug --watch
pnpm run start:cli       # CLI Nest (src/main-cli.ts)
pnpm test                # unitarios (*.spec.ts con jest)
pnpm run test:e2e        # e2e (test/jest-e2e.json)
pnpm run lint            # eslint
```

## Base de datos: migraciones y seed

```powershell
pnpm prisma generate          # regenera el cliente (tras tocar prisma/schema/*)
pnpm prisma migrate dev --name lo_que_cambie   # crea migración en desarrollo
pnpm prisma migrate deploy   # aplica migraciones (lo que corre Docker al arrancar)
pnpm db:seed                 # seeders (prisma/seeders/main.seeder.ts)
pnpm db:seed:vector          # seeder de vectores (si aplica)
```

> Con `docker-compose.dev.yml` (raíz) no necesitas correr nada de esto a mano:
> el entrypoint aplica migraciones y corre `db:seed` solo en cada arranque.
> Los seeders son idempotentes (upsert), así que levantar/bajar no duplica datos.

## Crear un usuario con el CLI de Nest

El backend trae un CLI (`src/main-cli.ts`, comando `user:create-admin`) para
crear usuarios con rol desde la terminal. Opciones: `-e/--email`,
`-p/--password` (mín. 8 caracteres), `--first-name`, `--last-name`,
`--employee-id` (opcional), `--role` (`ADMIN`, `EXHIBITOR`, `BUSINESS` o
`GUEST`; por defecto `ADMIN`). Ver ayuda: `... user:create-admin --help`.

> El CLI deja al usuario con `mustChangePassword=true` y
> `emailVerified=false`, así que **no podrá loguearse todavía**: el login exige
> ambas banderas (`emailVerified=true`, `mustChangePassword=false`). Actívalo
> con el SQL del paso 2.

### Sin Docker (desarrollo local con pnpm)

Requiere Postgres/Redis accesibles con tu `DATABASE_URL` de `backend/.env`
(`@localhost:5432`).

```powershell
Set-Location backend

# 1. Crear el usuario
pnpm run start:cli user:create-admin -e abiezer.reyes952@gmail.com -p "Admin123!" --first-name Admin --last-name Uapaverse --role ADMIN
# ✅ User created.

# 2. Activarlo para login (email verificado + sin cambio forzado).
#    OJO: en PowerShell las comillas dobles se pierden con `docker exec -c`,
#    por eso el SQL va por stdin con here-string.
@'
UPDATE "SystemUser" SET "emailVerified" = true, "mustChangePassword" = false WHERE email = 'admin@uapaverse.edu';
'@ | docker exec -i uapaverse_postgres_dev psql -U postgres -d modu

# 3. Probar login → debe devolver token
curl.exe -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@uapaverse.edu","password":"Admin123!"}'
```

### Con Docker (dentro del contenedor `api` / `backend`)

El CLI corre con el `DATABASE_URL` interno (`@postgres:5432`), no necesitas
exponer nada. Usa `exec` en el contenedor ya levantado:

```powershell
# Desde backend/ (servicio `api`)
docker compose exec api pnpm run start:cli user:create-admin -e admin@uapaverse.edu -p "Admin123!" --first-name Admin --last-name Uapaverse --role ADMIN

# Desde la raíz con el compose dev (servicio `backend`)
docker compose -f docker-compose.dev.yml exec backend pnpm run start:cli user:create-admin -e admin@uapaverse.edu -p "Admin123!" --first-name Admin --last-name Uapaverse --role ADMIN

# 2. Activarlo para login (igual que sin Docker, SQL por stdin)
@'
UPDATE "SystemUser" SET "emailVerified" = true, "mustChangePassword" = false WHERE email = 'admin@uapaverse.edu';
'@ | docker exec -i uapaverse_postgres_dev psql -U postgres -d modu

# 3. Probar login (API Docker → puerto 4000)
curl.exe -X POST http://localhost:4000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@uapaverse.edu","password":"Admin123!"}'
```

> Si el email ya existe verás `A user with email '...' already exists.`
> (el comando no duplica). La contraseña nunca va en claro a la BD: el CLI la
> guarda con hash bcrypt.

## Conectarte a Postgres y ver la base de datos

En desarrollo Docker la BD está en `localhost:5432` con las credenciales de tu
`.env` / `.env` raíz (`POSTGRES_USER/PASSWORD/DB`, por defecto
`postgres`/`postgres`/`uapaverse`).

Tu cadena de conexión tiene este formato:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/uapaverse"
#                 usuario ^^^^^^^^  password ^^^^^^^^  host ^^^^^^^^^  puerto ^^^^  bd ^^^^^^^^
```

### Opción A — Prisma Studio (la más fácil, con UI)

```powershell
Set-Location backend
pnpm prisma studio
# abre http://localhost:5555 → explora y edita tablas desde el navegador
```

### Opción B — psql dentro del contenedor (sin instalar nada)

```powershell
# Nombre del contenedor: uapaverse_postgres_dev (ver docker-compose.yml)
docker exec -it uapaverse_postgres_dev psql -U postgres -d uapaverse

# Dentro de psql:
\dt                 -- listar tablas
\d nombre_tabla     -- ver columnas de una tabla
SELECT * FROM "User" LIMIT 10;   -- consultar (ajusta el nombre; usa comillas si es mayúscula)
\q                  -- salir
```

Consulta de una sola línea sin entrar a psql:

```powershell
docker exec uapaverse_postgres_dev psql -U postgres -d uapaverse -c "SELECT id, email FROM users LIMIT 10;"
```

### Opción C — psql instalado en tu PC

```powershell
psql "postgresql://postgres:postgres@localhost:5432/uapaverse"
```

### Opción D — Cliente gráfico (DBeaver, pgAdmin, DataGrip, VS Code)

Crea una conexión PostgreSQL con estos datos:

| Campo | Valor (dev por defecto) |
| --- | --- |
| Host | `localhost` |
| Puerto | `5432` |
| Base de datos | `uapaverse` (o tu `DATABASE_NAME`) |
| Usuario | `postgres` (o tu `DATABASE_USER`) |
| Contraseña | `postgres` (o tu `DATABASE_PASSWORD`) |

> Si cambiaste `DATABASE_PORT` en el `.env` raíz, usa ese puerto.
> En producción (`docker-compose.prod.yml`) Postgres NO expone puerto al host;
> usa Prisma Studio con port-forward o conéctate desde dentro de la red Docker.

### Ver logs / verificar que la BD responde

```powershell
docker compose logs postgres
docker exec uapaverse_postgres_dev pg_isready -U postgres
```

## ¿Se actualiza en tiempo real?

Depende del modo:

- **Sí — `pnpm run start:dev` o `docker compose up` (dev):** el backend usa
  `ts-node-dev --poll`. Guardas un `.ts` de `src/` y la API se **reinicia sola** en
  2–5 s. No tienes que parar y arrancar nada. El flag `--poll` es lo que hace
  que detecte tus cambios dentro de Docker en Windows (los bind mounts no
  emiten eventos de archivo; sin polling el reinicio no se dispara).
  - El **navegador no se recarga solo**: el backend es una API. Repite la
    petición (o recarga la SPA / reintenta en Swagger en
    http://localhost:4000/api) y verás el cambio.
  - El frontend en dev (Vite HMR) sí se actualiza solo en el navegador al
    cambiar `.tsx`/`.css` — ver [frontend/README.md](../frontend/README.md).
- **Casos que NO recargan solos y requieren reinicio:**
  - Cambios en `.env` → `docker compose restart api` (o Ctrl+C + `start:dev`).
  - Cambios en `prisma/schema/*` → `pnpm prisma generate` (+ `migrate dev` si
    cambió el modelo) y reinicia.
  - Cambios en `package.json` → reinstala y reinicia.
- **No — producción (`start:prod`, imagen Docker prod):** el código está
  compilado en `dist/`. Hay que reconstruir (`pnpm build` / `docker build`)
  para ver cambios.

## Scripts

| Script | Descripción |
| --- | --- |
| `start:dev` | Dev con recarga (`ts-node-dev --poll`, detecta cambios en Docker) |
| `build` / `start:prod` | Compilar (`nest build` → `dist/src`) / correr compilado |
| `db:seed` / `db:seed:vector` | Seeders (`prisma/seeders/`) |
| `test` / `test:e2e` | Unitarios (`*.spec.ts`) / e2e |
| `start:cli` / `start:cli:prod` | CLI Nest (`src/main-cli.ts`, ts-node / compilado) |

## Metaverso 3D (`src/modules/metaverse`)

Alimenta la experiencia `/uapaverse` del frontend (spec §3) desde la base de datos:

- **Exposición:** `GET /api/v1/metaverse/exhibition` arma la feria activa → salas (`Room.category` = área) como pabellones → stands `PUBLICADO` de proyectos aprobados, con la ficha §2.1 (slogan, TRL, stack, video YouTube, demo, repo, PDF, equipo). El diseño 3D de cada stand sale de `Stand.layoutConfig` (`variant`, `accent`, `avatarEnabled`, `avatarModel`).
- **Moderación → 3D:** `PATCH /projects/:id/approve`, `PATCH /projects/:id/reject {observations}` (retira el stand del 3D y notifica) y `PATCH /projects/:id/publish` (publica y crea el stand en el pabellón de su área si no tiene).
- **Avatar IA:** `POST /metaverse/stands/:id/assistant/chat` recupera fragmentos (BM25 sobre FAQs `P:/R:`, ficha técnica y `KnowledgeBase`) y, si `OPENAI_API_URL`/`OPENAI_API_KEY` están configurados, genera la respuesta con `OPENAI_ASSISTANT_MODEL` usando el `avatarSystemPrompt` del proyecto; sin LLM responde de forma extractiva.
- **Analítica:** `POST /metaverse/analytics/events` (lotes del cliente 3D) → `MetaverseEvent` + `StandVisit`; `GET /metaverse/stands/:id/analytics` (admin o dueño) y `GET /metaverse/me/history`.
- **Multijugador:** WebSocket nativo en `ws://<host>:<PORT>/ws/presence?token=<JWT>` (mismo puerto que la API, `WsAdapter`). Solo usuarios activos con JWT válido; el servidor fija nombre/rol, difunde posiciones en lotes a 10 Hz, chat con rate limit, una sesión por cuenta y apertura de puertas sincronizada (`METAVERSE_DOORS_MODE=open|countdown|schedule`, `METAVERSE_LOBBY_COUNTDOWN_SECONDS`). Si hay un proxy delante, debe reenviar `Upgrade`/`Connection` para `/ws/`.
- **Capa social (mismo WebSocket):** mensajes directos (`dm`, se guardan en `ChatMessage`), señalización WebRTC para el chat de voz por proximidad (`voice`/`rtc`, solo entre usuarios con micrófono activo), reportes (`report` → `MetaverseEvent PRESENCE_REPORT` + notificación a ADMIN/SUPERADMIN) y moderación (`moderate`, solo organizadores: silencia chat, directos y voz). Cada usuario anuncia `standIds`: los stands publicados de los que es dueño o miembro del equipo (indicador "expositor presente").
- **Varias instancias:** con `METAVERSE_PRESENCE_REDIS=true` (usa `REDIS_HOST/PORT/PASSWORD`, canal `METAVERSE_PRESENCE_CHANNEL`, default `uapaverse:presence`) la presencia se comparte por Redis pub/sub: altas/bajas, posiciones, chat, voz, directos, moderación y una sesión por cuenta entre réplicas, con latido cada 5 s y reloj de puertas común. Sin esa variable la presencia vive en memoria del proceso (una sola instancia).

## Estructura

```text
src/            # API NestJS (alias: modules/*, src/*, prisma/*)
prisma/         # schema (models/), migraciones y seeders
test/           # config e2e
storage/        # archivos locales (se crea solo si falta)
Dockerfile      # imagen de producción
docker-compose.yml  # dev standalone: api + postgres + redis
docker-entrypoint.dev.sh  # entrypoint dev: install → migrate → seed opcional → start:dev
```

## Problemas comunes

| Síntoma | Solución |
| --- | --- |
| `ECONNREFUSED localhost:5432` | Levanta la infra: `docker compose up postgres redis -d` |
| `P1000` / password authentication failed | Tu `DATABASE_URL` no coincide con `POSTGRES_USER/PASSWORD` del contenedor; alinea `.env` y recrea el volumen (ojo: borra datos): `docker compose down -v` + `docker compose up --build` |
| `P3009` / migración marcada como fallida (`failed migrations… will not be applied`) | Una migración anterior falló (ej. `20260905173436_init` cuando faltaba pgvector) y quedó registrada en `_prisma_migrations`. Si aplicó 0 pasos es seguro revertir la marca y reintentar (con la BD arriba): `pnpm prisma migrate resolve --rolled-back "<nombre>"` y luego `pnpm prisma migrate deploy` (verifica con `migrate status` → `Database schema is up to date!`). Alternativas: en `docker-compose.dev.yml` descomenta `PRISMA_ROLLBACK_FAILED` una vez y levanta, o parte de cero con `docker compose down -v` + `up --build` (borra datos) |
| `FATAL: role "postgres" does not exist` aunque ya cambiaste el `.env` | El volumen `pg_dev_data` se creó con el usuario viejo. Postgres solo crea el usuario/BD la primera vez; cambiar el `.env` después no lo actualiza. Solución (desde `backend/`): `docker compose down -v` y luego `docker compose up --build`. No edites `prisma/init.sql` para esto: tiene sintaxis MySQL y no está montado en el compose, no tiene efecto en Postgres |
| `extension "vector" is not available` (código `0A000`) | Estás corriendo Postgres sin pgvector (imagen `postgres:16` pura o Postgres local sin la extensión). Con Docker: actualiza el compose a `pgvector/pgvector:pg16` (ya está así en este repo), recrea el servicio y vuelve a levantar: `docker compose up --build` (la migración crea la extensión sola). En Postgres local: instala pgvector (ver Requisitos) y luego `pnpm prisma migrate deploy` |
| Cambié `prisma/schema` y TypeScript falla | Corre `pnpm prisma generate` y reinicia |
| Cambié `.env` y no pasa nada | Reinicia: `docker compose restart api` |
| Puerto `4000`/`5432` ocupado | Cambia el mapeo en `docker-compose.yml` o libera el proceso |

## Archivos ignorados (.gitignore)

El `.gitignore` del backend evita subir al repo:

```text
/dist /node_modules /build /coverage     # compilados y dependencias
*.log, logs, src/storage/logs            # logs
.env, .env.*.local                       # secretos (DATABASE_URL, JWT, SMTP, Azure...)
.temp, .tmp, pids, *.pid                 # temporales y runtime
.vscode/* (salvo settings/tasks/launch)  # config personal del editor
.DS_Store, .idea, .project               # sistema / IDEs
```

Reglas clave:

- **`.env` nunca se commitea.** Solo `.env.example` (con `CHANGE_ME_*`).
  Si cambias credenciales de Postgres/Redis/JWT, hazlo en tu `.env` local.
- Si creas un `.env` nuevo desde `.env.example`, no necesitas tocar el
  `.gitignore`: ya está cubierto.
- `dist/` y `node_modules/` se regeneran (`pnpm install`, `pnpm build`),
  no los subas ni los edites a mano.
