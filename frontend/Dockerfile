# =========================================================
# Uapaverse Frontend — imagen de producción
# Build de Vite + servidor Nginx (SPA con fallback)
# =========================================================
FROM node:22-slim AS builder

WORKDIR /app

# pnpm exacto del proyecto (packageManager: pnpm@10.2.0)
RUN corepack enable && corepack prepare pnpm@10.2.0 --activate

# Instalar dependencias (se aprovecha la caché de Docker)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Compilar la app.
# VITE_API_URL se fija en tiempo de compilación: pásala con
# --build-arg o con la variable VITE_API_URL del compose.
COPY . .
ARG VITE_API_URL=http://localhost:4000/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm run build

# =========================================================
# Servidor de producción
# =========================================================
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
