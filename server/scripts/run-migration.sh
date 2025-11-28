#!/bin/bash

# Скрипт для выполнения SQL миграций
# Использование: ./scripts/run-migration.sh [путь_к_sql_файлу]

SQL_FILE="${1:-generate_tours.sql}"
DB_FILE="${DATABASE_URL:-file:./prisma/dev.db}"

# Извлекаем путь к базе данных из DATABASE_URL
if [[ $DB_FILE == file:* ]]; then
  DB_PATH="${DB_FILE#file:}"
else
  DB_PATH="$DB_FILE"
fi

# Проверяем существование файла SQL
if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Файл не найден: $SQL_FILE"
  exit 1
fi

# Проверяем существование базы данных
if [ ! -f "$DB_PATH" ]; then
  echo "⚠️  База данных не найдена: $DB_PATH"
  echo "Создайте базу данных с помощью: npm run prisma:push"
  exit 1
fi

# Проверяем наличие sqlite3
if ! command -v sqlite3 &> /dev/null; then
  echo "❌ sqlite3 не установлен"
  echo "Установите sqlite3: brew install sqlite3 (macOS) или apt-get install sqlite3 (Linux)"
  exit 1
fi

echo "📄 Выполнение миграции из файла: $SQL_FILE"
echo "🗄️  База данных: $DB_PATH"
echo ""

# Выполняем SQL файл
sqlite3 "$DB_PATH" < "$SQL_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✨ Миграция завершена успешно!"
else
  echo ""
  echo "❌ Ошибка при выполнении миграции"
  exit 1
fi

