import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function runMigration(sqlFile: string) {
  try {
    const filePath = path.resolve(sqlFile);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Файл не найден: ${filePath}`);
      process.exit(1);
    }

    console.log(`📄 Чтение файла: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Разбиваем SQL на отдельные запросы
    // Удаляем комментарии и пустые строки, разделяем по точке с запятой
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));

    console.log(`🔍 Найдено ${queries.length} SQL запросов`);

    // Выполняем каждый запрос
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      // Пропускаем пустые запросы и комментарии
      if (!query || query.startsWith('--')) {
        continue;
      }

      try {
        console.log(`\n📝 Выполнение запроса ${i + 1}/${queries.length}...`);
        // Используем $executeRawUnsafe для выполнения произвольного SQL
        await prisma.$executeRawUnsafe(query);
        console.log(`✅ Запрос ${i + 1} выполнен успешно`);
      } catch (error: any) {
        console.error(`❌ Ошибка при выполнении запроса ${i + 1}:`);
        console.error(`   ${error.message}`);
        // Продолжаем выполнение остальных запросов
        // Если нужно остановить при ошибке, раскомментируйте следующую строку:
        // throw error;
      }
    }

    console.log(`\n✨ Миграция завершена!`);
  } catch (error: any) {
    console.error(`❌ Критическая ошибка:`, error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Получаем путь к файлу из аргументов командной строки
const sqlFile = process.argv[2] || 'generate_tours.sql';

// Если путь относительный, делаем его относительно корня проекта
const filePath = path.isAbsolute(sqlFile) 
  ? sqlFile 
  : path.join(__dirname, '..', sqlFile);

runMigration(filePath);

