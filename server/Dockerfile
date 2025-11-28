FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

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

