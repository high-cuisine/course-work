import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { firstName: string; lastName: string; middleName?: string }) {
    const result = await this.prisma.$executeRawUnsafe(
      `INSERT INTO Client (firstName, lastName, middleName) VALUES (?, ?, ?)`,
      data.firstName,
      data.lastName,
      data.middleName ?? null,
    );
    const created = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM Client WHERE id = last_insert_rowid()`,
    );
    return created[0];
  }

  async findAll(search?: string) {
    let query = `SELECT * FROM Client WHERE 1=1`;
    const params: any[] = [];
    if (search) {
      query += ` AND (firstName LIKE ? OR lastName LIKE ? OR middleName LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    query += ` ORDER BY lastName, firstName`;
    return await this.prisma.$queryRawUnsafe<any[]>(query, ...params);
  }

  async findOne(id: number) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM Client WHERE id = ? LIMIT 1`,
      id,
    );
    if (!rows[0]) throw new NotFoundException('Client not found');
    return rows[0];
  }

  async update(
    id: number,
    data: { firstName?: string; lastName?: string; middleName?: string },
  ) {
    await this.findOne(id); // Check existence
    const updates: string[] = [];
    const values: any[] = [];
    if (data.firstName !== undefined) {
      updates.push('firstName = ?');
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      updates.push('lastName = ?');
      values.push(data.lastName);
    }
    if (data.middleName !== undefined) {
      updates.push('middleName = ?');
      values.push(data.middleName);
    }
    if (updates.length === 0) return this.findOne(id);
    values.push(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE Client SET ${updates.join(', ')} WHERE id = ?`,
      ...values,
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id); // Check existence
    await this.prisma.$executeRawUnsafe(`DELETE FROM Client WHERE id = ?`, id);
    return { message: 'Client deleted successfully' };
  }
}
