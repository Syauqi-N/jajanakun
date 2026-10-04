#!/bin/sh
set -e

# Pastikan folder data ada (di-mount sebagai volume di produksi).
mkdir -p /app/data /app/public/uploads

# Arahkan SQLite ke volume persisten bila DATABASE_URL belum diisi.
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/data/prod.db"
fi

# Sinkronkan skema ke DB. `db push` aman dijalankan tiap start untuk SQLite.
echo "[entrypoint] prisma db push ($DATABASE_URL)"
npx prisma db push --skip-generate --accept-data-loss

echo "[entrypoint] menjalankan server..."
exec "$@"
