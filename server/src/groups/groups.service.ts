import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const GROUP_SELECT = `
  SELECT
    g.id,
    CAST(g.tourId AS INTEGER) AS tourId,
    COALESCE(datetime(g.startDate), datetime('now')) AS startDateRaw,
    CAST(g.capacity AS INTEGER) AS capacity,
    CAST(g.fixedCost AS INTEGER) AS fixedCost,
    CAST(g.variableCostPerPerson AS INTEGER) AS variableCostPerPerson,
    (SELECT COUNT(*) FROM "Order" o WHERE o.groupId = g.id AND o.status = 'CONFIRMED') AS taken,
    t.name AS tourName,
    CAST(t.amount AS INTEGER) AS tourAmount
  FROM "Group" g
  JOIN Tour t ON g.tourId = t.id
`;

function mapGroupRow(r: Record<string, unknown>) {
  const raw = r.startDateRaw;
  let startDate: Date;
  if (raw == null) {
    startDate = new Date(0);
  } else {
    const s = String(raw);
    startDate = new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`);
    if (Number.isNaN(startDate.getTime())) startDate = new Date(0);
  }

  return {
    id: Number(r.id),
    tourId: Number(r.tourId),
    startDate,
    capacity: Number(r.capacity) || 0,
    fixedCost: Number(r.fixedCost) || 0,
    variableCostPerPerson: Number(r.variableCostPerPerson) || 0,
    taken: Number(r.taken) || 0,
    tourName: String(r.tourName ?? ''),
    tourAmount: Number(r.tourAmount) || 0,
  };
}

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
    const tourId = Number(data.tourId);
    if (!Number.isFinite(tourId)) {
      throw new BadRequestException('Некорректный tourId');
    }
    const tour = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM Tour WHERE id = ? LIMIT 1`,
      tourId,
    );
    if (!tour[0]) throw new NotFoundException('Tour not found');

    const t = new Date(data.startDate).getTime();
    if (Number.isNaN(t)) {
      throw new BadRequestException('Некорректная дата');
    }
    const startDateIso = new Date(data.startDate).toISOString();

    const capacity = Number(data.capacity);
    if (!Number.isFinite(capacity)) {
      throw new BadRequestException('Некорректное значение capacity');
    }

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "Group" (tourId, startDate, capacity, fixedCost, variableCostPerPerson)
       VALUES (?, ?, ?, ?, ?)`,
      tourId,
      startDateIso,
      capacity,
      Number(data.fixedCost ?? 0),
      Number(data.variableCostPerPerson ?? 0),
    );

    const created = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `${GROUP_SELECT} WHERE g.id = last_insert_rowid()`,
    );
    if (!created[0]) throw new NotFoundException('Group not found');
    return mapGroupRow(created[0]);
  }

  async findAll(tourId?: number) {
    if (tourId !== undefined) {
      const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `${GROUP_SELECT} WHERE g.tourId = ? ORDER BY g.startDate`,
        tourId,
      );
      return rows.map(mapGroupRow);
    }
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `${GROUP_SELECT} ORDER BY g.id`,
    );
    return rows.map(mapGroupRow);
  }

  async findOne(id: number) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `${GROUP_SELECT} WHERE g.id = ? LIMIT 1`,
      id,
    );
    if (!rows[0]) throw new NotFoundException('Group not found');
    return mapGroupRow(rows[0]);
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
    await this.findOne(id);

    if (data.tourId !== undefined) {
      const tour = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM Tour WHERE id = ? LIMIT 1`,
        Number(data.tourId),
      );
      if (!tour[0]) throw new NotFoundException('Tour not found');
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (data.tourId !== undefined) {
      updates.push('tourId = ?');
      values.push(Number(data.tourId));
    }
    if (data.startDate !== undefined) {
      const t = new Date(data.startDate).getTime();
      if (Number.isNaN(t)) {
        throw new BadRequestException('Некорректная дата');
      }
      updates.push('startDate = ?');
      values.push(new Date(data.startDate).toISOString());
    }
    if (data.capacity !== undefined) {
      const n = Number(data.capacity);
      if (!Number.isFinite(n)) {
        throw new BadRequestException('Некорректное значение capacity');
      }
      updates.push('capacity = ?');
      values.push(n);
    }
    if (data.fixedCost !== undefined) {
      const n = Number(data.fixedCost);
      if (!Number.isFinite(n)) {
        throw new BadRequestException('Некорректное значение fixedCost');
      }
      updates.push('fixedCost = ?');
      values.push(n);
    }
    if (data.variableCostPerPerson !== undefined) {
      const n = Number(data.variableCostPerPerson);
      if (!Number.isFinite(n)) {
        throw new BadRequestException('Некорректное значение variableCostPerPerson');
      }
      updates.push('variableCostPerPerson = ?');
      values.push(n);
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
    await this.findOne(id);
    const orders = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as count FROM "Order" WHERE groupId = ? AND status = 'CONFIRMED'`,
      id,
    );
    if (Number(orders[0]?.count ?? 0) > 0) {
      throw new BadRequestException('Cannot delete group with confirmed orders');
    }
    await this.prisma.$executeRawUnsafe(`DELETE FROM "Group" WHERE id = ?`, id);
    return { message: 'Group deleted successfully' };
  }
}
