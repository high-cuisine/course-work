import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Для тел запроса, где boolean может прийти строкой/числом */
function sqliteBool(v: boolean | string | number | undefined | null): number {
  if (v === true || v === 'true' || v === 1 || v === '1') return 1;
  return 0;
}

function toSqliteDateTime(value: string): string {
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) {
    throw new BadRequestException('Некорректная дата');
  }
  return new Date(value).toISOString();
}

/** Нормализация bool в SQLite (0/1, текст, мусор после старых raw INSERT) */
const SQL_BOOL = (col: string) =>
  `(CASE WHEN typeof(${col}) = 'integer' AND ${col} != 0 THEN 1 WHEN lower(cast(${col} as text)) IN ('1','true') THEN 1 ELSE 0 END)`;

const TOUR_SELECT = `
  SELECT
    t.id,
    t.name,
    CAST(t.amount AS INTEGER) AS amount,
    t.hotel,
    t.place,
    COALESCE(datetime(t.date), datetime('now')) AS tourDateRaw,
    CAST(t.routeId AS INTEGER) AS routeId,
    t.country,
    t.description,
    CASE WHEN t.hotelStars IS NULL THEN NULL ELSE CAST(t.hotelStars AS INTEGER) END AS hotelStars,
    t.transport,
    t.meals,
    ${SQL_BOOL('t.insuranceIncluded')} AS insuranceIncluded,
    ${SQL_BOOL('t.guideIncluded')} AS guideIncluded,
    CASE WHEN t.maxGroupSize IS NULL THEN NULL ELSE CAST(t.maxGroupSize AS INTEGER) END AS maxGroupSize,
    r.place AS routePlace,
    r.duration AS routeDuration
  FROM Tour t
  JOIN Route r ON t.routeId = r.id
`;

function mapTourSqlRow(row: Record<string, unknown>) {
  const raw = row.tourDateRaw;
  let date: Date;
  if (raw == null) {
    date = new Date(0);
  } else {
    const s = String(raw);
    date = new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`);
    if (Number.isNaN(date.getTime())) date = new Date(0);
  }

  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    amount: Number(row.amount) || 0,
    hotel: String(row.hotel ?? ''),
    place: String(row.place ?? ''),
    date,
    routeId: Number(row.routeId),
    country: row.country != null && row.country !== '' ? String(row.country) : null,
    description:
      row.description != null && row.description !== '' ? String(row.description) : null,
    hotelStars: row.hotelStars == null ? null : Number(row.hotelStars),
    transport: row.transport != null && row.transport !== '' ? String(row.transport) : null,
    meals: row.meals != null && row.meals !== '' ? String(row.meals) : null,
    insuranceIncluded: Number(row.insuranceIncluded) === 1,
    guideIncluded: Number(row.guideIncluded) === 1,
    maxGroupSize: row.maxGroupSize == null ? null : Number(row.maxGroupSize),
    routePlace: String(row.routePlace ?? ''),
    routeDuration: Number(row.routeDuration) || 0,
  };
}

@Injectable()
export class ToursService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    amount: number;
    hotel: string;
    place: string;
    date: string;
    routeId: number;
    country?: string;
    description?: string;
    hotelStars?: number;
    transport?: string;
    meals?: string;
    insuranceIncluded?: boolean;
    guideIncluded?: boolean;
    maxGroupSize?: number;
  }) {
    const routeId = Number(data.routeId);
    const amount = Number(data.amount);
    if (!Number.isFinite(routeId) || !Number.isFinite(amount)) {
      throw new BadRequestException('Некорректные routeId или amount');
    }
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');

    const hotelStars =
      data.hotelStars === undefined || data.hotelStars === null
        ? null
        : Number(data.hotelStars);
    const maxGroupSize =
      data.maxGroupSize === undefined || data.maxGroupSize === null
        ? null
        : Number(data.maxGroupSize);
    if (hotelStars !== null && !Number.isFinite(hotelStars)) {
      throw new BadRequestException('Некорректное значение hotelStars');
    }
    if (maxGroupSize !== null && !Number.isFinite(maxGroupSize)) {
      throw new BadRequestException('Некорректное значение maxGroupSize');
    }

    const dateIso = toSqliteDateTime(String(data.date));

    const created = await this.prisma.tour.create({
      data: {
        name: String(data.name ?? '').trim(),
        amount,
        hotel: String(data.hotel ?? '').trim(),
        place: String(data.place ?? '').trim(),
        date: new Date(dateIso),
        routeId,
        country: data.country != null ? String(data.country).trim() || null : null,
        description:
          data.description != null ? String(data.description).trim() || null : null,
        hotelStars,
        transport: data.transport != null ? String(data.transport).trim() || null : null,
        meals: data.meals != null ? String(data.meals).trim() || null : null,
        insuranceIncluded: sqliteBool(data.insuranceIncluded) === 1,
        guideIncluded: sqliteBool(data.guideIncluded) === 1,
        maxGroupSize,
      },
    });
    return this.findOne(created.id);
  }

  async findAll(filters?: {
    country?: string;
    minAmount?: number;
    maxAmount?: number;
    hotelStars?: number;
    transport?: string;
    meals?: string;
  }) {
    let sql = `${TOUR_SELECT} WHERE 1=1`;
    const params: unknown[] = [];

    if (filters?.country) {
      sql += ` AND t.country = ?`;
      params.push(filters.country);
    }
    if (filters?.minAmount !== undefined) {
      sql += ` AND t.amount >= ?`;
      params.push(filters.minAmount);
    }
    if (filters?.maxAmount !== undefined) {
      sql += ` AND t.amount <= ?`;
      params.push(filters.maxAmount);
    }
    if (filters?.hotelStars !== undefined) {
      sql += ` AND t.hotelStars = ?`;
      params.push(filters.hotelStars);
    }
    if (filters?.transport) {
      sql += ` AND t.transport = ?`;
      params.push(filters.transport);
    }
    if (filters?.meals) {
      sql += ` AND t.meals = ?`;
      params.push(filters.meals);
    }

    sql += ` ORDER BY t.id`;
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      sql,
      ...params,
    );
    return rows.map(mapTourSqlRow);
  }

  async findOne(id: number) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `${TOUR_SELECT} WHERE t.id = ? LIMIT 1`,
      id,
    );
    if (!rows[0]) throw new NotFoundException('Tour not found');
    return mapTourSqlRow(rows[0]);
  }

  async update(
    id: number,
    data: {
      name?: string;
      hotel?: string;
      place?: string;
      date?: string;
      routeId?: number;
      country?: string;
      description?: string;
      hotelStars?: number;
      transport?: string;
      meals?: string;
      insuranceIncluded?: boolean;
      guideIncluded?: boolean;
      maxGroupSize?: number;
      amount?: number;
    },
  ) {
    await this.findOne(id);

    if (data.routeId !== undefined) {
      const route = await this.prisma.route.findUnique({
        where: { id: Number(data.routeId) },
      });
      if (!route) throw new NotFoundException('Route not found');
    }

    const sets: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      sets.push('name = ?');
      values.push(String(data.name).trim());
    }
    if (data.amount !== undefined) {
      const n = Number(data.amount);
      if (!Number.isFinite(n)) throw new BadRequestException('Некорректное значение amount');
      sets.push('amount = ?');
      values.push(n);
    }
    if (data.hotel !== undefined) {
      sets.push('hotel = ?');
      values.push(String(data.hotel).trim());
    }
    if (data.place !== undefined) {
      sets.push('place = ?');
      values.push(String(data.place).trim());
    }
    if (data.date !== undefined) {
      sets.push('date = ?');
      values.push(toSqliteDateTime(String(data.date)));
    }
    if (data.routeId !== undefined) {
      sets.push('routeId = ?');
      values.push(Number(data.routeId));
    }
    if (data.country !== undefined) {
      sets.push('country = ?');
      values.push(String(data.country).trim() || null);
    }
    if (data.description !== undefined) {
      sets.push('description = ?');
      values.push(String(data.description).trim() || null);
    }
    if (data.hotelStars !== undefined) {
      const n = data.hotelStars === null ? null : Number(data.hotelStars);
      if (n !== null && !Number.isFinite(n)) {
        throw new BadRequestException('Некорректное значение hotelStars');
      }
      sets.push('hotelStars = ?');
      values.push(n);
    }
    if (data.transport !== undefined) {
      sets.push('transport = ?');
      values.push(data.transport != null ? String(data.transport).trim() || null : null);
    }
    if (data.meals !== undefined) {
      sets.push('meals = ?');
      values.push(data.meals != null ? String(data.meals).trim() || null : null);
    }
    if (data.insuranceIncluded !== undefined) {
      sets.push('insuranceIncluded = ?');
      values.push(sqliteBool(data.insuranceIncluded));
    }
    if (data.guideIncluded !== undefined) {
      sets.push('guideIncluded = ?');
      values.push(sqliteBool(data.guideIncluded));
    }
    if (data.maxGroupSize !== undefined) {
      const n = data.maxGroupSize === null ? null : Number(data.maxGroupSize);
      if (n !== null && !Number.isFinite(n)) {
        throw new BadRequestException('Некорректное значение maxGroupSize');
      }
      sets.push('maxGroupSize = ?');
      values.push(n);
    }

    if (sets.length === 0) return this.findOne(id);

    values.push(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE Tour SET ${sets.join(', ')} WHERE id = ?`,
      ...values,
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.$executeRawUnsafe(`DELETE FROM Tour WHERE id = ?`, id);
    return { message: 'Tour deleted successfully' };
  }
}
