import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { place: string; duration: number }) {
    const result = await this.prisma.$executeRawUnsafe(
      `INSERT INTO Route (place, duration) VALUES (?, ?)`,
      data.place,
      data.duration,
    );
    const created = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM Route WHERE id = last_insert_rowid()`,
    );
    return created[0];
  }

  async findAll() {
    return await this.prisma.$queryRawUnsafe<any[]>(`SELECT * FROM Route ORDER BY id`);
  }

  async findOne(id: number) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM Route WHERE id = ? LIMIT 1`,
      id,
    );
    if (!rows[0]) throw new NotFoundException('Route not found');
    return rows[0];
  }

  async update(id: number, data: { place?: string; duration?: number }) {
    await this.findOne(id); // Check existence
    const updates: string[] = [];
    const values: any[] = [];
    if (data.place !== undefined) {
      updates.push('place = ?');
      values.push(data.place);
    }
    if (data.duration !== undefined) {
      updates.push('duration = ?');
      values.push(data.duration);
    }
    if (updates.length === 0) return this.findOne(id);
    values.push(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE Route SET ${updates.join(', ')} WHERE id = ?`,
      ...values,
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id); // Check existence
    await this.prisma.$executeRawUnsafe(`DELETE FROM Route WHERE id = ?`, id);
    return { message: 'Route deleted successfully' };
  }
}
