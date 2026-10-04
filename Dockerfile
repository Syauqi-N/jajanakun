# syntax=docker/dockerfile:1

# ---------- deps: pasang dependensi (termasuk dev, untuk build) ----------
FROM node:22-alpine AS deps
WORKDIR /app
# libc6-compat dibutuhkan sharp/prisma di Alpine.
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
# --ignore-scripts: lewati postinstall `prisma generate` di stage ini
# (schema.prisma belum di-copy). Generate dijalankan di stage builder.
RUN npm ci --ignore-scripts

# ---------- builder: generate prisma client + build Next ----------
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma generate butuh DATABASE_URL walau tak mengakses DB.
ENV DATABASE_URL="file:./dev.db"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build
# Kumpulkan prisma CLI + dependensinya ke ./prisma-cli (untuk `db push` di runner).
RUN node scripts/bundle-prisma-cli.mjs

# ---------- runner: image runtime ramping ----------
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Aset publik + standalone output.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma: schema + CLI mandiri (dependensi lengkap) untuk `db push` saat start.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma-cli/node_modules ./prisma-cli/node_modules

# Skrip entri: siapkan folder data (DB + uploads) lalu jalankan server.
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Volume: SQLite DB + gambar upload. Keduanya ditulis saat runtime.
RUN mkdir -p /app/data /app/public/uploads && chown -R nextjs:nodejs /app/data /app/public/uploads
VOLUME ["/app/data", "/app/public/uploads"]

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "server.js"]
