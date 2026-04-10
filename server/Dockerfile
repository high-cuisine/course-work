FROM node:20-slim

# Устанавливаем необходимые системные зависимости для нативных модулей
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# SQLite вне bind-mount (именованный том /app/data) — избегаем ошибки "Unable to open the database file"
ENV DATABASE_URL="file:/app/data/dev.db"

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы
COPY . .

RUN chmod +x /app/docker-entrypoint.sh \
  && mkdir -p /app/data \
  && npx prisma generate \
  && (npx prisma db push || true)

# Открываем порт
EXPOSE 4004

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]

