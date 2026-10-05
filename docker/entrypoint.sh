#!/bin/sh
set -e

# Pastikan folder data ada (di-mount sebagai volume di produksi).
mkdir -p /app/data /app/public/uploads

# Arahkan SQLite ke volume persisten bila DATABASE_URL belum diisi.
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/data/prod.db"
fi

# Sinkronkan skema ke DB. `db push` aman dijalankan tiap start untuk SQLite.
# Panggil CLI Prisma langsung via node — `npx` tak menemukannya di image
# standalone (folder node_modules/.bin tidak ikut di-copy).
echo "[entrypoint] prisma db push ($DATABASE_URL)"
PRISMA_CLI="/app/prisma-cli/node_modules/prisma/build/index.js"
if [ -f "$PRISMA_CLI" ]; then
  node "$PRISMA_CLI" db push --skip-generate --accept-data-loss
else
  npx --yes prisma db push --skip-generate --accept-data-loss
fi

echo "[entrypoint] menjalankan server..."
# Di balik reverse-proxy/Cloudflare Tunnel, Next standalone membangun `req.url`
# dari HOSTNAME (mis. 0.0.0.0:3000) sehingga redirect server action bisa nyasar.
# Solusi: beri tahu Next host publik lewat HOSTNAME, tapi tetap BIND ke 0.0.0.0
# memakai flag -H eksplisit agar container tetap dapat diakses.
if [ -n "$PUBLIC_HOSTNAME" ]; then
  export HOSTNAME="$PUBLIC_HOSTNAME"
  exec node server.js -H 0.0.0.0 -p "${PORT:-3000}"
fi
exec "$@"
