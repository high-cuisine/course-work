import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
    const hash = await bcrypt.hash(password, 10);
    const initialBalance = 50000; // Начальный баланс для нового пользователя
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO User (name, password, role, balance, createdAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      name,
      hash,
      finalRole,
      initialBalance,
    );
    const created = await this.findByName(name);
    return created;
  }

  async findAll() {
    return await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, role, balance, createdAt FROM User ORDER BY id`,
    );
  }

  async update(id: number, data: { role?: string; balance?: number; password?: string }) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

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
      const user = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, name, role, balance, createdAt FROM User WHERE id = ? LIMIT 1`,
        id,
      );
      return user[0];
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
    return updated[0];
  }

  async remove(id: number) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.$executeRawUnsafe(`DELETE FROM User WHERE id = ?`, id);
    return { message: 'User deleted successfully' };
  }

  async updateBalance(id: number, amount: number) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const newBalance = user.balance + amount;
    if (newBalance < 0) throw new BadRequestException('Insufficient balance');
    await this.prisma.$executeRawUnsafe(`UPDATE User SET balance = ? WHERE id = ?`, newBalance, id);
    const updated = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, role, balance, createdAt FROM User WHERE id = ? LIMIT 1`,
      id,
    );
    return updated[0];
  }
}


