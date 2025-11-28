import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: number, tourId: number, groupId?: number) {
    const tourRows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, amount FROM Tour WHERE id = ? LIMIT 1`,
      tourId,
    );
    const tour = tourRows[0];
    if (!tour) throw new NotFoundException('Tour not found');

    if (groupId) {
      const grp = (
        await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT id, capacity, (SELECT COUNT(*) FROM "Order" o WHERE o.groupId = g.id AND o.status = 'CONFIRMED') AS taken FROM "Group" g WHERE id = ? LIMIT 1`,
          groupId,
        )
      )[0];
      if (!grp) throw new NotFoundException('Group not found');
      if (grp.taken >= grp.capacity) throw new BadRequestException('No free seats');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const user = (
        await tx.$queryRawUnsafe<any[]>(
          `SELECT id, balance FROM User WHERE id = ? LIMIT 1`,
          userId,
        )
      )[0];
      if (!user) throw new NotFoundException('User not found');
      if (user.balance < tour.amount) throw new BadRequestException('Insufficient balance');

      await tx.$executeRawUnsafe(
        `UPDATE User SET balance = balance - ? WHERE id = ?`,
        tour.amount,
        userId,
      );

      await tx.$executeRawUnsafe(
        `INSERT INTO "Order" (amount, userId, tourId, groupId, status, createdAt) VALUES (?, ?, ?, ?, 'CONFIRMED', CURRENT_TIMESTAMP)`,
        tour.amount,
        userId,
        tourId,
        groupId ?? null,
      );

      const created = (
        await tx.$queryRawUnsafe<any[]>(
          `SELECT o.id, o.amount, o.tourId, o.groupId, o.status, o.createdAt FROM "Order" o WHERE o.userId = ? ORDER BY o.id DESC LIMIT 1`,
          userId,
        )
      )[0];
      return created;
    });

    return result;
  }

  async findAll(userId?: number, isAdminOrModerator: boolean = false) {
    let query = `SELECT o.*, 
                 u.name as userName, 
                 t.name as tourName, t.place as tourPlace, t.hotel as tourHotel,
                 g.startDate as groupStartDate, g.capacity as groupCapacity
                 FROM "Order" o
                 JOIN User u ON o.userId = u.id
                 JOIN Tour t ON o.tourId = t.id
                 LEFT JOIN "Group" g ON o.groupId = g.id`;
    if (!isAdminOrModerator && userId) {
      query += ` WHERE o.userId = ?`;
      return await this.prisma.$queryRawUnsafe<any[]>(
        query + ` ORDER BY o.createdAt DESC`,
        userId,
      );
    }
    return await this.prisma.$queryRawUnsafe<any[]>(query + ` ORDER BY o.createdAt DESC`);
  }

  async findOne(id: number, userId?: number, isAdminOrModerator: boolean = false) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT o.*, 
       u.name as userName, 
       t.name as tourName, t.place as tourPlace, t.hotel as tourHotel,
       g.startDate as groupStartDate, g.capacity as groupCapacity
       FROM "Order" o
       JOIN User u ON o.userId = u.id
       JOIN Tour t ON o.tourId = t.id
       LEFT JOIN "Group" g ON o.groupId = g.id
       WHERE o.id = ? LIMIT 1`,
      id,
    );
    if (!rows[0]) throw new NotFoundException('Order not found');
    if (!isAdminOrModerator && rows[0].userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return rows[0];
  }

  async updateStatus(
    id: number,
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED',
    userId?: number,
    isAdminOrModerator: boolean = false,
  ) {
    const order = await this.findOne(id, userId, isAdminOrModerator);
    if (!isAdminOrModerator && order.userId !== userId) {
      throw new ForbiddenException('Only admins and moderators can change order status');
    }

    if (status === 'CANCELLED' && order.status === 'CONFIRMED') {
      // Refund money to user
      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          `UPDATE User SET balance = balance + ? WHERE id = ?`,
          order.amount,
          order.userId,
        );
        await tx.$executeRawUnsafe(
          `UPDATE "Order" SET status = ?, cancelledAt = CURRENT_TIMESTAMP WHERE id = ?`,
          status,
          id,
        );
      });
    } else {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "Order" SET status = ? WHERE id = ?`,
        status,
        id,
      );
    }
    return this.findOne(id, userId, isAdminOrModerator);
  }

  async cancel(id: number, userId: number, isAdminOrModerator: boolean = false) {
    return this.updateStatus(id, 'CANCELLED', userId, isAdminOrModerator);
  }

  async remove(id: number, userId: number, isAdminOrModerator: boolean = false) {
    const order = await this.findOne(id, userId, isAdminOrModerator);
    if (!isAdminOrModerator) {
      throw new ForbiddenException('Only admins and moderators can delete orders');
    }
    
    // Если заказ был подтвержден, возвращаем деньги
    if (order.status === 'CONFIRMED') {
      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          `UPDATE User SET balance = balance + ? WHERE id = ?`,
          order.amount,
          order.userId,
        );
        await tx.$executeRawUnsafe(`DELETE FROM "Order" WHERE id = ?`, id);
      });
    } else {
      await this.prisma.$executeRawUnsafe(`DELETE FROM "Order" WHERE id = ?`, id);
    }
    return { message: 'Order deleted successfully' };
  }
}


