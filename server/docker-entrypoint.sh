#!/bin/sh
set -e
# Создаём каталог БД и применяем схему (именованный том или пустой mount)
mkdir -p /app/data
npx prisma db push
exec "$@"
