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
exec "$@"
