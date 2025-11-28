import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    const result = await this.prisma.$executeRawUnsafe(
      `INSERT INTO Tour (name, amount, hotel, place, date, routeId, country, description, hotelStars, transport, meals, insuranceIncluded, guideIncluded, maxGroupSize) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.name,
      data.amount,
      data.hotel,
      data.place,
      data.date,
      data.routeId,
      data.country ?? null,
      data.description ?? null,
      data.hotelStars ?? null,
      data.transport ?? null,
      data.meals ?? null,
      data.insuranceIncluded ?? false,
      data.guideIncluded ?? false,
      data.maxGroupSize ?? null,
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
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
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
