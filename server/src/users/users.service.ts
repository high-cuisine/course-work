import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const SUPER_ADMIN_NAME = (process.env.SUPER_ADMIN_NAME || 'admin').trim();
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'admin123';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const existing = await this.findByName(SUPER_ADMIN_NAME);
      if (!existing) {
        const hash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO User (name, password, role, balance, createdAt) VALUES (?, ?, 'admin', 50000, CURRENT_TIMESTAMP)`,
          SUPER_ADMIN_NAME,
          hash,
        );
        this.logger.log(`Super admin "${SUPER_ADMIN_NAME}" created`);
      } else if (existing.role !== 'admin') {
        await this.prisma.$executeRawUnsafe(
          `UPDATE User SET role = 'admin' WHERE id = ?`,
          existing.id,
        );
        this.logger.log(`Super admin "${SUPER_ADMIN_NAME}" promoted to admin`);
      }
    } catch (err) {
      this.logger.error('Failed to ensure super admin', err as Error);
    }
  }

  isSuperAdminName(name: string): boolean {
    if (!name) return false;
    return name.trim().toLowerCase() === SUPER_ADMIN_NAME.toLowerCase();
  }

  private decorate<T extends { name?: string } | null | undefined>(user: T): T {
    if (!user) return user;
    return { ...(user as any), isSuperAdmin: this.isSuperAdminName((user as any).name) };
  }

  async findByName(name: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, password, role, balance, createdAt FROM User WHERE name = ? LIMIT 1`,
      name,
    );
    return rows[0] ?? null;
  }

  async findById(id: number) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, password, role, balance, createdAt FROM User WHERE id = ? LIMIT 1`,
      id,
    );
    return rows[0] ?? null;
  }

  async create(name: string, password: string, role: string = 'user') {
    const allowed = new Set(['user', 'admin', 'moderator']);
    const finalRole = allowed.has(role) ? role : 'user';
    const trimmedName = String(name ?? '').trim();
    if (!trimmedName) {
      throw new BadRequestException('Имя обязательно');
    }
    if (this.isSuperAdminName(trimmedName)) {
      throw new ConflictException('Имя уже занято');
    }

    const existing = await this.findByName(trimmedName);
    if (existing) {
      throw new ConflictException('Имя уже занято');
    }

    const hash = await bcrypt.hash(password, 10);
    const initialBalance = 50000;
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO User (name, password, role, balance, createdAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        trimmedName,
        hash,
        finalRole,
        initialBalance,
      );
    } catch (err: any) {
      const code = err?.meta?.code;
      const message = String(err?.meta?.message ?? err?.message ?? '');
      if (code === '2067' || /UNIQUE constraint failed: User\.name/i.test(message)) {
        throw new ConflictException('Имя уже занято');
      }
      throw err;
    }
    const created = await this.findByName(trimmedName);
    return created;
  }

  async findAll() {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, role, balance, createdAt FROM User ORDER BY id`,
    );
    return rows.map((r) => ({ ...r, isSuperAdmin: this.isSuperAdminName(r.name) }));
  }

  async update(
    id: number,
    data: { role?: string; balance?: number; password?: string },
  ) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (this.isSuperAdminName(user.name)) {
      throw new ForbiddenException('Cannot modify super admin');
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (data.role !== undefined) {
      const allowed = new Set(['user', 'admin', 'moderator']);
      if (!allowed.has(data.role)) {
        throw new BadRequestException('Invalid role');
      }
      updates.push('role = ?');
      values.push(data.role);
    }

    if (data.balance !== undefined) {
      updates.push('balance = ?');
      values.push(data.balance);
    }

    if (data.password !== undefined) {
      const hash = await bcrypt.hash(data.password, 10);
      updates.push('password = ?');
      values.push(hash);
    }

    if (updates.length === 0) {
      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, name, role, balance, createdAt FROM User WHERE id = ? LIMIT 1`,
        id,
      );
      return this.decorate(rows[0]);
    }

    values.push(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE User SET ${updates.join(', ')} WHERE id = ?`,
      ...values,
    );

    const updated = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, role, balance, createdAt FROM User WHERE id = ? LIMIT 1`,
      id,
    );
    return this.decorate(updated[0]);
  }

  async remove(id: number) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (this.isSuperAdminName(user.name)) {
      throw new ForbiddenException('Cannot modify super admin');
    }
    await this.prisma.$executeRawUnsafe(`DELETE FROM User WHERE id = ?`, id);
    return { message: 'User deleted successfully' };
  }

  async updateBalance(id: number, amount: number) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (this.isSuperAdminName(user.name)) {
      throw new ForbiddenException('Cannot modify super admin');
    }
    const newBalance = user.balance + amount;
    if (newBalance < 0) throw new BadRequestException('Insufficient balance');
    await this.prisma.$executeRawUnsafe(
      `UPDATE User SET balance = ? WHERE id = ?`,
      newBalance,
      id,
    );
    const updated = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, role, balance, createdAt FROM User WHERE id = ? LIMIT 1`,
      id,
    );
    return this.decorate(updated[0]);
  }

  async findOrders(userId: number) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT
         o.id,
         CAST(o.amount AS INTEGER) AS amount,
         o.status,
         o.createdAt,
         CAST(o.tourId AS INTEGER) AS tourId,
         CAST(o.groupId AS INTEGER) AS groupId,
         t.name AS tourName,
         t.place AS tourPlace,
         t.hotel AS tourHotel,
         CASE WHEN g.startDate IS NULL THEN NULL ELSE datetime(g.startDate) END AS groupStartDate
       FROM "Order" o
       JOIN Tour t ON o.tourId = t.id
       LEFT JOIN "Group" g ON o.groupId = g.id
       WHERE o.userId = ?
       ORDER BY o.createdAt DESC`,
      userId,
    );
    return rows.map((r) => ({
      id: Number(r.id),
      amount: Number(r.amount) || 0,
      status: String(r.status ?? ''),
      createdAt: r.createdAt,
      tourId: r.tourId == null ? null : Number(r.tourId),
      groupId: r.groupId == null ? null : Number(r.groupId),
      tourName: String(r.tourName ?? ''),
      tourPlace: String(r.tourPlace ?? ''),
      tourHotel: String(r.tourHotel ?? ''),
      groupStartDate: r.groupStartDate ?? null,
    }));
  }
}
