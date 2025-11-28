# Docker Compose для приложения Tour Booking

Этот проект использует Docker Compose для запуска всего приложения в контейнерах.

## Структура

- **server** - NestJS backend сервер (порт 4004)
- **client** - React/Vite frontend клиент (порт 5174)

## Быстрый старт

### 1. Запуск всех сервисов

```bash
docker-compose up
```

Или в фоновом режиме:

```bash
docker-compose up -d
```

### 2. Остановка сервисов

```bash
docker-compose down
```

### 3. Пересборка образов

```bash
docker-compose build
```

Или принудительная пересборка:

```bash
docker-compose build --no-cache
```

### 4. Просмотр логов

Все сервисы:
```bash
docker-compose logs -f
```

Только сервер:
```bash
docker-compose logs -f server
```

Только клиент:
```bash
docker-compose logs -f client
```

## Доступ к приложению

После запуска приложение будет доступно:

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:4004

## Переменные окружения

Создайте файл `.env` в корне проекта (рядом с `docker-compose.yml`):

```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES=7d
```

## Выполнение миграций

Для выполнения SQL миграций в контейнере сервера:

```bash
# Войти в контейнер сервера
docker-compose exec server sh

# Выполнить миграцию
npm run migrate generate_tours.sql
```

Или одной командой:

```bash
docker-compose exec server npm run migrate generate_tours.sql
```

## Разработка

### Hot Reload

Оба сервиса настроены на hot reload:
- Изменения в `server/src` автоматически перезагружают сервер
- Изменения в `client/src` автоматически перезагружают клиент

### Доступ к базе данных

База данных SQLite находится в `server/prisma/dev.db` и монтируется как volume, поэтому данные сохраняются между перезапусками.

### Prisma Studio

Для просмотра базы данных через Prisma Studio:

```bash
docker-compose exec server npm run prisma:studio
```

Затем откройте http://localhost:5555 (если порт проброшен) или используйте:

```bash
docker-compose exec -p 5555:5555 server npm run prisma:studio
```

## Проблемы и решения

### Порт уже занят

Если порты 4004 или 5174 заняты, измените их в `docker-compose.yml`:

```yaml
ports:
  - "4005:4004"  # Внешний:Внутренний
```

### Ошибки при сборке

1. Очистите кэш Docker:
```bash
docker-compose down -v
docker system prune -a
```

2. Пересоберите образы:
```bash
docker-compose build --no-cache
```

### База данных не создается

Выполните миграции вручную:

```bash
docker-compose exec server npm run prisma:push
docker-compose exec server npm run migrate generate_tours.sql
```

## Production сборка

Для production используйте отдельные Dockerfile с оптимизацией:

```bash
# Сборка production образов
docker-compose -f docker-compose.prod.yml build

# Запуск production
docker-compose -f docker-compose.prod.yml up -d
```

## Полезные команды

```bash
# Перезапуск всех сервисов
docker-compose restart

# Перезапуск конкретного сервиса
docker-compose restart server

# Просмотр статуса
docker-compose ps

# Остановка и удаление контейнеров и volumes
docker-compose down -v

# Просмотр использования ресурсов
docker stats
```

