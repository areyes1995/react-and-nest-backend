# Uapaverse Frontend

SPA React 19 + Vite + Tailwind.

- Local con pnpm → http://localhost:5173
- Docker dev → http://localhost:5173 (con HMR)
- Docker prod → http://localhost:8080 (Nginx, sin HMR)

## Requisitos

- Node.js 22+ y pnpm 10.2.0 (`corepack prepare pnpm@10.2.0 --activate`)
- Docker (opcional, para las formas 2 y 3)
- Backend corriendo (salvo que uses `VITE_MOCK_ENABLED=true`)
- Puerto libre: `5173` (dev) / `8080` (prod)

## Configuración (.env)

```powershell
Copy-Item .env.example .env
```

Variables principales (ver `.env.example`):

| Variable | Uso |
| --- | --- |
| `VITE_API_URL` | URL base del backend **vista desde tu navegador** |
| `VITE_AUTH_METHOD` | `db` o `ldap` |
| `VITE_MOCK_ENABLED` | `true` usa mocks locales (sin backend) |
| `VITE_APP_NAME` | Nombre mostrado en la UI |

Valores típicos:

```env
# Backend local con pnpm (puerto 3000)
VITE_API_URL=http://localhost:3000/api/v1

# Backend en Docker dev (puerto 4000)
VITE_API_URL=http://localhost:4000/api/v1
```

> `VITE_*` se fija al arrancar Vite. Si la cambias, **reinicia** el servidor
> dev. El error más común (pantalla en blanco / login que falla) es apuntar al
> puerto equivocado: `3000` en local, `4000` en Docker.

## Forma 1 — Desarrollo local con pnpm (más rápido, HMR)

```powershell
pnpm install
pnpm dev        # http://localhost:5173
```

Con una URL de API concreta (sin editar `.env`):

```powershell
$env:VITE_API_URL="http://localhost:3000/api/v1"; pnpm dev
```

Otros comandos:

```powershell
pnpm build      # tsc -b && vite build → dist/
pnpm preview    # previsualiza el build en local (SIN HMR, como prod)
```

> Nota: hoy `pnpm build` no pasa el typecheck estricto (`tsc -b`) por errores
> preexistentes en varios módulos. `pnpm dev` funciona con normalidad porque
> Vite no typecheckea.

## Forma 2 — Desarrollo con Docker standalone (HMR)

Desde `frontend/`, levanta solo la SPA con recarga en caliente:

```powershell
# La API debe estar accesible desde tu navegador:
$env:VITE_API_URL="http://localhost:4000/api/v1"; docker compose up --build
# http://localhost:5173 (con HMR)
```

Variantes:

```powershell
docker compose up --build -d   # en segundo plano
docker compose logs -f frontend
docker compose restart frontend  # tras cambiar .env o vite.config.ts
docker compose down
```

## Forma 3 — Desarrollo con Docker desde la raíz (frontend + backend + BD)

```powershell
Set-Location ..
docker compose up --build
# frontend → http://localhost:5173
# backend  → http://localhost:4000/api/v1
```

Solo frontend del compose raíz (asume que el backend ya corre):

```powershell
docker compose up --build frontend
```

## Forma 4 — Producción con Docker (Nginx, sin HMR)

La imagen es multietapa: compila Vite y sirve `dist/` con Nginx (fallback SPA
en `nginx.conf`). `VITE_API_URL` queda **congelada en el build**:

```powershell
docker build --build-arg VITE_API_URL=http://localhost:4000/api/v1 -t uapaverse-frontend .
docker run -p 8080:80 uapaverse-frontend
# http://localhost:8080
```

O todo el stack prod desde la raíz:

```powershell
Set-Location ..
docker compose -f docker-compose.prod.yml up --build -d
# frontend → http://localhost:8080
```

## ¿Se actualiza en tiempo real en el navegador? Sí (en dev)

En desarrollo el frontend usa **Vite HMR (Hot Module Replacement)**:

1. Corres `pnpm dev` o `docker compose up` (dev).
2. Abres http://localhost:5173.
3. Editas un `.tsx`, `.ts`, `.css` en `src/` y guardas.
4. El navegador **se actualiza al instante, sin recargar la página** y en la
   mayoría de casos **sin perder el estado** (ruta actual, texto de
   formularios, paneles abiertos).

Qué sí / qué no:

| Cambio | ¿Tiempo real? | Qué hacer |
| --- | --- | --- |
| Componentes, estilos, rutas, lógica en `src/` | ✅ Sí, HMR instantáneo | Solo guardar |
| Llamadas a la API (misma URL) | ✅ Sí, la próxima petición trae datos nuevos | Interactúa con la UI o recarga si quieres |
| `.env` / `VITE_*` | ❌ No | Reinicia Vite / `docker compose restart frontend` |
| `vite.config.ts`, `package.json` (nueva dep) | ❌ No | Reinicia (y `pnpm install` si agregaste dep) |
| Backend (`backend/src/`) | ⚠️ Parcial | La API se reinicia sola (ts-node-dev); el navegador no: repite la petición. Ver [backend/README.md](../backend/README.md) |
| Producción (`preview`, Nginx, `docker-compose.prod.yml`) | ❌ No | Reconstruye: `pnpm build` / `docker build` |

Detalles técnicos:

- `vite.config.ts` tiene `server.watch.usePolling: true` para que el HMR
  funcione también dentro de Docker (volúmenes en Windows), y `hmr.overlay: true`
  para mostrar errores en el navegador.
- El proxy `/api → http://localhost:3000` de `vite.config.ts` solo aplica a
  llamadas relativas (`/api/...`) en dev local. En la práctica la app usa
  `VITE_API_URL` absoluta, así que lo que manda es tu `.env`.
- Si editas y no ves cambios: revisa la terminal de Vite (ahí sale el error),
  confirma que editaste dentro de `frontend/` montado en el volumen, y que no
  fue un `.env`/`vite.config.ts` (esos piden reinicio).

## Scripts

| Script | Descripción |
| --- | --- |
| `dev` | Servidor Vite con HMR (`vite`) |
| `build` | `tsc -b && vite build` |
| `preview` | Previsualizar el build (sin HMR) |

## Problemas comunes

| Síntoma | Solución |
| --- | --- |
| Pantalla en blanco / `ERR_CONNECTION_REFUSED` a la API | `VITE_API_URL` incorrecta: usa `:3000` con backend local, `:4000` con backend Docker; luego reinicia Vite |
| Cambié `.env` y no pasa nada | Reinicia: `Ctrl+C` + `pnpm dev` o `docker compose restart frontend` |
| `Port 5173 is in use` | Libera el puerto o arranca en otro: `pnpm dev -- --port 5174` |
| HMR no recarga en Docker | Debe correr con `--host 0.0.0.0` (ya lo hace el compose); si persiste, `docker compose restart frontend` |
| Login falla solo con Docker | El navegador debe alcanzar `VITE_API_URL`; `http://localhost:4000/api/v1` desde tu PC, no el hostname interno `backend` |

## Archivos ignorados (.gitignore)

El `.gitignore` del frontend evita subir al repo:

```text
node_modules, dist, dist-ssr             # dependencias y compilados
.env, .env.*.local, *.local              # secretos (VITE_API_URL, LDAP, mock secret...)
*.log, logs                              # logs
.vscode/* (salvo extensions.json)        # config personal del editor
.idea, .DS_Store                         # sistema / IDEs
```

Reglas clave:

- **`.env` nunca se commitea.** Solo `.env.example`. Si pruebas otra API o
  activas mocks (`VITE_MOCK_ENABLED=true`), hazlo en tu `.env` local.
- `dist/` se regenera con `pnpm build`; no lo subas ni lo edites a mano.
- `local-config/*.json` sí se commitea (son los módulos del frontend); el
  servidor dev de Vite los sirve y guarda desde `vite.config.ts`.
