import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** SQLite + Prisma raw: boolean как 0/1, иначе при чтении строки — «invalid characters». */
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
    // Check route exists
    const route = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM Route WHERE id = ? LIMIT 1`,
      data.routeId,
    );
    if (!route[0]) throw new NotFoundException('Route not found');

    const routeId = Number(data.routeId);
    const amount = Number(data.amount);
    if (!Number.isFinite(routeId) || !Number.isFinite(amount)) {
      throw new BadRequestException('Некорректные routeId или amount');
    }
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

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO Tour (name, amount, hotel, place, date, routeId, country, description, hotelStars, transport, meals, insuranceIncluded, guideIncluded, maxGroupSize) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      String(data.name ?? '').trim(),
      amount,
      String(data.hotel ?? '').trim(),
      String(data.place ?? '').trim(),
      dateIso,
      routeId,
      data.country != null ? String(data.country).trim() || null : null,
      data.description != null ? String(data.description).trim() || null : null,
      hotelStars,
      data.transport != null ? String(data.transport).trim() || null : null,
      data.meals != null ? String(data.meals).trim() || null : null,
      sqliteBool(data.insuranceIncluded),
      sqliteBool(data.guideIncluded),
      maxGroupSize,
    );
    const created = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT t.*, r.place as routePlace, r.duration as routeDuration 
       FROM Tour t 
       JOIN Route r ON t.routeId = r.id 
       WHERE t.id = last_insert_rowid()`,
    );
    return created[0];
  }

  async findAll(filters?: {
    country?: string;
    minAmount?: number;
    maxAmount?: number;
    hotelStars?: number;
    transport?: string;
    meals?: string;
  }) {
    let query = `SELECT t.*, r.place as routePlace, r.duration as routeDuration 
                 FROM Tour t 
                 JOIN Route r ON t.routeId = r.id 
                 WHERE 1=1`;
    const params: any[] = [];

    if (filters?.country) {
      query += ` AND t.country = ?`;
      params.push(filters.country);
    }
    if (filters?.minAmount !== undefined) {
      query += ` AND t.amount >= ?`;
      params.push(filters.minAmount);
    }
    if (filters?.maxAmount !== undefined) {
      query += ` AND t.amount <= ?`;
      params.push(filters.maxAmount);
    }
    if (filters?.hotelStars !== undefined) {
      query += ` AND t.hotelStars = ?`;
      params.push(filters.hotelStars);
    }
    if (filters?.transport) {
      query += ` AND t.transport = ?`;
      params.push(filters.transport);
    }
    if (filters?.meals) {
      query += ` AND t.meals = ?`;
      params.push(filters.meals);
    }

    query += ` ORDER BY t.id`;
    return await this.prisma.$queryRawUnsafe<any[]>(query, ...params);
  }

  async findOne(id: number) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT t.*, r.place as routePlace, r.duration as routeDuration 
       FROM Tour t 
       JOIN Route r ON t.routeId = r.id 
       WHERE t.id = ? LIMIT 1`,
      id,
    );
    if (!rows[0]) throw new NotFoundException('Tour not found');
    return rows[0];
  }

  async update(
    id: number,
    data: {
      name?: string;
      amount?: number;
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
    },
  ) {
    await this.findOne(id); // Check existence

    if (data.routeId !== undefined) {
      const route = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM Route WHERE id = ? LIMIT 1`,
        data.routeId,
      );
      if (!route[0]) throw new NotFoundException('Route not found');
    }

    const updates: string[] = [];
    const values: any[] = [];
    const fields: { [key: string]: any } = {
      name: data.name,
      amount: data.amount,
      hotel: data.hotel,
      place: data.place,
      date: data.date,
      routeId: data.routeId,
      country: data.country,
      description: data.description,
      hotelStars: data.hotelStars,
      transport: data.transport,
      meals: data.meals,
      insuranceIncluded: data.insuranceIncluded,
      guideIncluded: data.guideIncluded,
      maxGroupSize: data.maxGroupSize,
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      if (key === 'insuranceIncluded' || key === 'guideIncluded') {
        updates.push(`${key} = ?`);
        values.push(sqliteBool(value as boolean));
        continue;
      }
      if (key === 'date' && value !== null) {
        updates.push(`${key} = ?`);
        values.push(toSqliteDateTime(String(value)));
        continue;
      }
      if (key === 'routeId' || key === 'amount' || key === 'hotelStars' || key === 'maxGroupSize') {
        const n = value === null ? null : Number(value);
        if (n !== null && !Number.isFinite(n)) {
          throw new BadRequestException(`Некорректное значение ${key}`);
        }
        updates.push(`${key} = ?`);
        values.push(n);
        continue;
      }
      updates.push(`${key} = ?`);
      values.push(value);
    }

    if (updates.length === 0) return this.findOne(id);
    values.push(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE Tour SET ${updates.join(', ')} WHERE id = ?`,
      ...values,
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id); // Check existence
    await this.prisma.$executeRawUnsafe(`DELETE FROM Tour WHERE id = ?`, id);
    return { message: 'Tour deleted successfully' };
  }
}
