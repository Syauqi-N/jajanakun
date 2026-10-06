#!/bin/sh
set -e

# Pastikan folder data ada (di-mount sebagai volume di produksi).
mkdir -p /app/data /app/public/uploads /app/data/backups

# Arahkan SQLite ke volume persisten bila DATABASE_URL belum diisi.
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/data/prod.db"
fi

# Panggil CLI Prisma langsung via node — `npx` tak menemukannya di image
# standalone (folder node_modules/.bin tidak ikut di-copy).
PRISMA_CLI="/app/prisma-cli/node_modules/prisma/build/index.js"
prisma() {
  if [ -f "$PRISMA_CLI" ]; then
    node "$PRISMA_CLI" "$@"
  else
    npx --yes prisma "$@"
  fi
}

# Backup DB sebelum migrasi (simpan 10 terakhir).
DB_FILE="${DATABASE_URL#file:}"
if [ -f "$DB_FILE" ]; then
  STAMP="$(date +%Y%m%d-%H%M%S)"
  cp "$DB_FILE" "/app/data/backups/$(basename "$DB_FILE").$STAMP.bak"
  ls -1t /app/data/backups/*.bak 2>/dev/null | tail -n +11 | xargs -r rm -f
  echo "[entrypoint] backup DB -> /app/data/backups/$(basename "$DB_FILE").$STAMP.bak"
fi

# Terapkan migrasi (prisma/migrations). Tidak pernah menghapus data diam-diam:
# migrasi yang destruktif harus ditulis & di-review eksplisit.
echo "[entrypoint] prisma migrate deploy ($DATABASE_URL)"
if ! OUT="$(prisma migrate deploy 2>&1)"; then
  echo "$OUT"
  # P3005: DB lama (dibuat dengan `db push`) belum punya riwayat migrasi.
  # Tandai baseline 0_init sebagai sudah diterapkan, lalu ulangi.
  if echo "$OUT" | grep -q "P3005"; then
    echo "[entrypoint] DB belum punya riwayat migrasi — baseline 0_init"
    # Samakan dulu ke skema 0_init (hanya perubahan aman; gagal bila destruktif).
    prisma db push --skip-generate
    prisma migrate resolve --applied 0_init
    prisma migrate deploy
  else
    exit 1
  fi
else
  echo "$OUT"
fi

echo "[entrypoint] menjalankan server..."
exec "$@"
