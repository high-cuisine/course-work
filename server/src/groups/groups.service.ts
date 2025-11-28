import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    tourId: number;
    startDate: string;
    capacity: number;
    fixedCost?: number;
    variableCostPerPerson?: number;
  }) {
    // Check tour exists
    const tour = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM Tour WHERE id = ? LIMIT 1`,
      data.tourId,
    );
    if (!tour[0]) throw new NotFoundException('Tour not found');

    const result = await this.prisma.$executeRawUnsafe(
      `INSERT INTO "Group" (tourId, startDate, capacity, fixedCost, variableCostPerPerson) 
       VALUES (?, ?, ?, ?, ?)`,
      data.tourId,
      data.startDate,
      data.capacity,
      data.fixedCost ?? 0,
      data.variableCostPerPerson ?? 0,
    );
    const created = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT g.*, 
       (SELECT COUNT(*) FROM "Order" o WHERE o.groupId = g.id AND o.status = 'CONFIRMED') as taken,
       t.name as tourName, t.amount as tourAmount
       FROM "Group" g 
       JOIN Tour t ON g.tourId = t.id 
       WHERE g.id = last_insert_rowid()`,
    );
    return created[0];
  }

  async findAll(tourId?: number) {
    let query = `SELECT g.*, 
                 (SELECT COUNT(*) FROM "Order" o WHERE o.groupId = g.id AND o.status = 'CONFIRMED') as taken,
                 t.name as tourName, t.amount as tourAmount
                 FROM "Group" g 
                 JOIN Tour t ON g.tourId = t.id`;
    if (tourId) {
      query += ` WHERE g.tourId = ?`;
      return await this.prisma.$queryRawUnsafe<any[]>(query + ` ORDER BY g.startDate`, tourId);
    }
    return await this.prisma.$queryRawUnsafe<any[]>(query + ` ORDER BY g.id`);
  }

  async findOne(id: number) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT g.*, 
       (SELECT COUNT(*) FROM "Order" o WHERE o.groupId = g.id AND o.status = 'CONFIRMED') as taken,
       t.name as tourName, t.amount as tourAmount
       FROM "Group" g 
       JOIN Tour t ON g.tourId = t.id 
       WHERE g.id = ? LIMIT 1`,
      id,
    );
    if (!rows[0]) throw new NotFoundException('Group not found');
    return rows[0];
  }

  async update(
    id: number,
    data: {
      tourId?: number;
      startDate?: string;
      capacity?: number;
      fixedCost?: number;
      variableCostPerPerson?: number;
    },
  ) {
    await this.findOne(id); // Check existence

    if (data.tourId !== undefined) {
      const tour = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM Tour WHERE id = ? LIMIT 1`,
        data.tourId,
      );
      if (!tour[0]) throw new NotFoundException('Tour not found');
    }

    const updates: string[] = [];
    const values: any[] = [];
    const fields: { [key: string]: any } = {
      tourId: data.tourId,
      startDate: data.startDate,
      capacity: data.capacity,
      fixedCost: data.fixedCost,
      variableCostPerPerson: data.variableCostPerPerson,
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
      `UPDATE "Group" SET ${updates.join(', ')} WHERE id = ?`,
      ...values,
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id); // Check existence
    // Check if there are confirmed orders
    const orders = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as count FROM "Order" WHERE groupId = ? AND status = 'CONFIRMED'`,
      id,
    );
    if (orders[0]?.count > 0) {
      throw new BadRequestException('Cannot delete group with confirmed orders');
    }
    await this.prisma.$executeRawUnsafe(`DELETE FROM "Group" WHERE id = ?`, id);
    return { message: 'Group deleted successfully' };
  }
}
