FROM node:20-slim

# Устанавливаем необходимые системные зависимости для нативных модулей
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Создаем базу данных если её нет
RUN npx prisma db push || true

# Открываем порт
EXPOSE 4004

# Запускаем приложение
CMD ["npm", "run", "start:dev"]

