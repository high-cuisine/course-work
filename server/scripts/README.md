# Скрипты для выполнения SQL миграций

Этот каталог содержит скрипты для автоматического выполнения SQL миграций из файлов.

## Доступные скрипты

### 1. TypeScript версия (рекомендуется)
```bash
npm run migrate [путь_к_файлу.sql]
```

Пример:
```bash
npm run migrate generate_tours.sql
npm run migrate ./migrations/custom.sql
```

### 2. JavaScript версия
```bash
npm run migrate:js [путь_к_файлу.sql]
```

### 3. Bash версия (требует sqlite3)
```bash
npm run migrate:sh [путь_к_файлу.sql]
```

Или напрямую:
```bash
./scripts/run-migration.sh generate_tours.sql
```

## Использование

### Базовое использование
Если не указать путь к файлу, по умолчанию используется `generate_tours.sql`:
```bash
npm run migrate
```

### Указание конкретного файла
```bash
npm run migrate path/to/your/migration.sql
```

### Абсолютный путь
```bash
npm run migrate /absolute/path/to/migration.sql
```

## Особенности

- ✅ Автоматически разбивает SQL на отдельные запросы
- ✅ Пропускает комментарии (строки начинающиеся с `--`)
- ✅ Продолжает выполнение при ошибках в отдельных запросах
- ✅ Выводит подробную информацию о процессе
- ✅ Использует Prisma для подключения к базе данных

## Требования

- Node.js и npm установлены
- База данных создана (выполните `npm run prisma:push` если нужно)
- Для TypeScript версии: `ts-node` (уже в devDependencies)
- Для bash версии: `sqlite3` должен быть установлен в системе

## Примеры SQL файлов

Создайте файл `generate_tours.sql` в корне проекта:

```sql
-- Создание маршрутов
INSERT INTO Route (place, duration) VALUES 
('Турция, Анталия', 7),
('Египет, Хургада', 10);

-- Создание туров
INSERT INTO Tour (name, amount, hotel, place, date, routeId) VALUES
('Отдых в Анталии', 45000, 'Grand Hotel', 'Анталия', datetime('now', '+30 days'), 
 (SELECT id FROM Route WHERE place = 'Турция, Анталия' LIMIT 1));
```

## Устранение неполадок

### Ошибка: "Файл не найден"
Убедитесь, что путь к файлу указан правильно. Относительные пути считаются от корня проекта.

### Ошибка: "База данных не найдена"
Выполните `npm run prisma:push` для создания базы данных.

### Ошибка: "sqlite3 не установлен" (для bash версии)
- macOS: `brew install sqlite3`
- Linux: `sudo apt-get install sqlite3`
- Windows: Скачайте с официального сайта SQLite

