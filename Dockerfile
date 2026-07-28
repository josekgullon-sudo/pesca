# Imagen de producción de Mapa de Pesca.
#
# Va con node_modules completos en vez de con la salida `standalone` de Next a
# propósito: la app usa dos módulos nativos (better-sqlite3 y sharp) y el CLI de
# Prisma para migrar al arrancar, y armar eso a mano sobre standalone es una
# fuente constante de fallos raros en producción. La imagen pesa más, pero
# arranca y migra sola.

FROM node:22-slim AS deps
WORKDIR /app

# openssl lo necesita Prisma; el resto, por si algún módulo nativo no tiene
# binario precompilado para esta plataforma y hay que compilarlo.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# El postinstall ejecuta `prisma generate`, así que el schema tiene que estar
# antes de instalar.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund


FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# En el build no se toca la base de datos (todas las páginas son dinámicas),
# pero el CLI de Prisma exige que la variable exista.
ENV DATABASE_URL="file:./prisma/dev.db"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build


FROM node:22-slim AS runner
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Todo lo que hay que conservar vive aquí: la base de datos y las fotos.
ENV DATABASE_URL="file:/app/datos/pesca.db"

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json /app/prisma.config.ts /app/next.config.ts ./
COPY docker/arranque.sh /arranque.sh
RUN chmod +x /arranque.sh && mkdir -p /app/datos

EXPOSE 3000
CMD ["/arranque.sh"]
