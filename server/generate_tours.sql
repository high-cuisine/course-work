-- SQL скрипт для генерации туров (SQLite)
-- Сначала создаем маршруты
-- Внимание: если маршруты уже существуют, удалите их или измените значения

-- Создание маршрутов (выполните только если их еще нет)
INSERT INTO Route (place, duration) VALUES 
('Турция, Анталия', 7),
('Египет, Хургада', 10),
('ОАЭ, Дубай', 7),
('Тайланд, Пхукет', 14),
('Греция, Крит', 7),
('Испания, Барселона', 5),
('Италия, Рим', 6),
('Франция, Париж', 4),
('Мальдивы, Мале', 10),
('Бали, Индонезия', 12);

-- Генерация туров
-- Получаем ID маршрутов для использования
INSERT INTO Tour (
  name, 
  amount, 
  hotel, 
  place, 
  date, 
  routeId, 
  country, 
  description, 
  hotelStars, 
  transport, 
  meals, 
  insuranceIncluded, 
  guideIncluded, 
  maxGroupSize
) VALUES
-- Турция
('Отдых в Анталии', 45000, 'Grand Hotel Antalya', 'Анталия', datetime('now', '+30 days'), 
 (SELECT id FROM Route WHERE place = 'Турция, Анталия' LIMIT 1),
 'Турция', 'Прекрасный отдых на берегу Средиземного моря', 5, 'plane', 'AI', 1, 0, 30),

('Эконом тур в Анталию', 28000, 'Sunset Beach Hotel', 'Анталия', datetime('now', '+45 days'),
 (SELECT id FROM Route WHERE place = 'Турция, Анталия' LIMIT 1),
 'Турция', 'Бюджетный вариант отдыха', 3, 'plane', 'HB', 0, 0, 40),

-- Египет
('Роскошный Египет', 65000, 'Hurghada Grand Resort', 'Хургада', datetime('now', '+20 days'),
 (SELECT id FROM Route WHERE place = 'Египет, Хургада' LIMIT 1),
 'Египет', 'Все включено с дайвингом', 5, 'plane', 'AI', 1, 1, 25),

('Классический Египет', 42000, 'Red Sea Hotel', 'Хургада', datetime('now', '+35 days'),
 (SELECT id FROM Route WHERE place = 'Египет, Хургада' LIMIT 1),
 'Египет', 'Отдых и экскурсии', 4, 'plane', 'HB', 0, 1, 35),

-- ОАЭ
('Дубай - город мечты', 85000, 'Burj Al Arab', 'Дубай', datetime('now', '+25 days'),
 (SELECT id FROM Route WHERE place = 'ОАЭ, Дубай' LIMIT 1),
 'ОАЭ', 'Роскошный отдых в самом дорогом отеле', 7, 'plane', 'AI', 1, 1, 20),

('Дубай эконом', 55000, 'Dubai Marina Hotel', 'Дубай', datetime('now', '+40 days'),
 (SELECT id FROM Route WHERE place = 'ОАЭ, Дубай' LIMIT 1),
 'ОАЭ', 'Доступный отдых в Дубае', 4, 'plane', 'BB', 0, 0, 30),

-- Тайланд
('Экзотический Пхукет', 95000, 'Phuket Paradise Resort', 'Пхукет', datetime('now', '+50 days'),
 (SELECT id FROM Route WHERE place = 'Тайланд, Пхукет' LIMIT 1),
 'Тайланд', 'Двухнедельный отдых в тропическом раю', 5, 'plane', 'AI', 1, 1, 20),

('Пхукет для всех', 72000, 'Beach View Hotel', 'Пхукет', datetime('now', '+60 days'),
 (SELECT id FROM Route WHERE place = 'Тайланд, Пхукет' LIMIT 1),
 'Тайланд', 'Комфортный отдых на пляже', 4, 'plane', 'HB', 0, 0, 30),

-- Греция
('Мифы и легенды Крита', 58000, 'Crete Grand Hotel', 'Крит', datetime('now', '+28 days'),
 (SELECT id FROM Route WHERE place = 'Греция, Крит' LIMIT 1),
 'Греция', 'Отдых и экскурсии по историческим местам', 4, 'plane', 'HB', 0, 1, 25),

('Семейный отдых на Крите', 45000, 'Family Resort Crete', 'Крит', datetime('now', '+42 days'),
 (SELECT id FROM Route WHERE place = 'Греция, Крит' LIMIT 1),
 'Греция', 'Идеально для семей с детьми', 3, 'plane', 'AI', 1, 0, 35),

-- Испания
('Барселона - столица Каталонии', 48000, 'Barcelona Central Hotel', 'Барселона', datetime('now', '+15 days'),
 (SELECT id FROM Route WHERE place = 'Испания, Барселона' LIMIT 1),
 'Испания', 'Городской тур с экскурсиями', 4, 'plane', 'BB', 0, 1, 30),

('Барселона выходного дня', 35000, 'City Center Hotel', 'Барселона', datetime('now', '+10 days'),
 (SELECT id FROM Route WHERE place = 'Испания, Барселона' LIMIT 1),
 'Испания', 'Короткий тур на выходные', 3, 'plane', 'BB', 0, 0, 40),

-- Италия
('Рим - вечный город', 52000, 'Rome Classic Hotel', 'Рим', datetime('now', '+22 days'),
 (SELECT id FROM Route WHERE place = 'Италия, Рим' LIMIT 1),
 'Италия', 'Экскурсионный тур по достопримечательностям', 4, 'plane', 'HB', 0, 1, 25),

('Рим и Ватикан', 60000, 'Vatican View Hotel', 'Рим', datetime('now', '+30 days'),
 (SELECT id FROM Route WHERE place = 'Италия, Рим' LIMIT 1),
 'Италия', 'Тур с посещением Ватикана', 5, 'plane', 'HB', 1, 1, 20),

-- Франция
('Париж - город любви', 55000, 'Paris Eiffel Hotel', 'Париж', datetime('now', '+18 days'),
 (SELECT id FROM Route WHERE place = 'Франция, Париж' LIMIT 1),
 'Франция', 'Романтический тур по Парижу', 4, 'plane', 'BB', 0, 1, 25),

('Париж премиум', 75000, 'Luxury Paris Hotel', 'Париж', datetime('now', '+25 days'),
 (SELECT id FROM Route WHERE place = 'Франция, Париж' LIMIT 1),
 'Франция', 'Роскошный отдых в Париже', 5, 'plane', 'HB', 1, 1, 15),

-- Мальдивы
('Рай на Мальдивах', 120000, 'Maldives Overwater Villa', 'Мале', datetime('now', '+55 days'),
 (SELECT id FROM Route WHERE place = 'Мальдивы, Мале' LIMIT 1),
 'Мальдивы', 'Эксклюзивный отдых в вилле над водой', 5, 'plane', 'AI', 1, 0, 15),

('Мальдивы мечты', 95000, 'Maldives Beach Resort', 'Мале', datetime('now', '+65 days'),
 (SELECT id FROM Route WHERE place = 'Мальдивы, Мале' LIMIT 1),
 'Мальдивы', 'Роскошный пляжный отдых', 5, 'plane', 'AI', 1, 0, 20),

-- Бали
('Бали - остров богов', 88000, 'Bali Paradise Resort', 'Бали', datetime('now', '+70 days'),
 (SELECT id FROM Route WHERE place = 'Бали, Индонезия' LIMIT 1),
 'Индонезия', 'Экзотический отдых с экскурсиями', 5, 'plane', 'AI', 1, 1, 20),

('Бали для души', 75000, 'Bali Spiritual Retreat', 'Бали', datetime('now', '+80 days'),
 (SELECT id FROM Route WHERE place = 'Бали, Индонезия' LIMIT 1),
 'Индонезия', 'Йога и медитация на Бали', 4, 'plane', 'HB', 0, 1, 18);

