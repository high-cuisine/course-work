import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

type TourWithRoute = Prisma.TourGetPayload<{ include: { route: true } }>;

function toApiRow(t: TourWithRoute) {
  const { route, ...rest } = t;
  return {
    ...rest,
    routePlace: route.place,
    routeDuration: route.duration,
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
      include: { route: true },
    });
    return toApiRow(created);
  }

  async findAll(filters?: {
    country?: string;
    minAmount?: number;
    maxAmount?: number;
    hotelStars?: number;
    transport?: string;
    meals?: string;
  }) {
    const where: Prisma.TourWhereInput = {};
    if (filters?.country) where.country = filters.country;
    if (filters?.minAmount !== undefined || filters?.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) where.amount.gte = filters.minAmount;
      if (filters.maxAmount !== undefined) where.amount.lte = filters.maxAmount;
    }
    if (filters?.hotelStars !== undefined) where.hotelStars = filters.hotelStars;
    if (filters?.transport) where.transport = filters.transport;
    if (filters?.meals) where.meals = filters.meals;

    const rows = await this.prisma.tour.findMany({
      where,
      include: { route: true },
      orderBy: { id: 'asc' },
    });
    return rows.map(toApiRow);
  }

  async findOne(id: number) {
    const row = await this.prisma.tour.findUnique({
      where: { id },
      include: { route: true },
    });
    if (!row) throw new NotFoundException('Tour not found');
    return toApiRow(row);
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
    await this.findOne(id);

    if (data.routeId !== undefined) {
      const route = await this.prisma.route.findUnique({
        where: { id: Number(data.routeId) },
      });
      if (!route) throw new NotFoundException('Route not found');
    }

    const patch: Prisma.TourUpdateInput = {};

    if (data.name !== undefined) patch.name = String(data.name).trim();
    if (data.amount !== undefined) {
      const n = Number(data.amount);
      if (!Number.isFinite(n)) throw new BadRequestException('Некорректное значение amount');
      patch.amount = n;
    }
    if (data.hotel !== undefined) patch.hotel = String(data.hotel).trim();
    if (data.place !== undefined) patch.place = String(data.place).trim();
    if (data.date !== undefined) patch.date = new Date(toSqliteDateTime(String(data.date)));
    if (data.routeId !== undefined) {
      patch.route = { connect: { id: Number(data.routeId) } };
    }
    if (data.country !== undefined) patch.country = String(data.country).trim() || null;
    if (data.description !== undefined) {
      patch.description = String(data.description).trim() || null;
    }
    if (data.hotelStars !== undefined) {
      const n =
        data.hotelStars === null ? null : Number(data.hotelStars);
      if (n !== null && !Number.isFinite(n)) {
        throw new BadRequestException('Некорректное значение hotelStars');
      }
      patch.hotelStars = n;
    }
    if (data.transport !== undefined) {
      patch.transport = data.transport != null ? String(data.transport).trim() || null : null;
    }
    if (data.meals !== undefined) {
      patch.meals = data.meals != null ? String(data.meals).trim() || null : null;
    }
    if (data.insuranceIncluded !== undefined) {
      patch.insuranceIncluded = sqliteBool(data.insuranceIncluded) === 1;
    }
    if (data.guideIncluded !== undefined) {
      patch.guideIncluded = sqliteBool(data.guideIncluded) === 1;
    }
    if (data.maxGroupSize !== undefined) {
      const n =
        data.maxGroupSize === null ? null : Number(data.maxGroupSize);
      if (n !== null && !Number.isFinite(n)) {
        throw new BadRequestException('Некорректное значение maxGroupSize');
      }
      patch.maxGroupSize = n;
    }

    if (Object.keys(patch).length === 0) return this.findOne(id);

    const updated = await this.prisma.tour.update({
      where: { id },
      data: patch,
      include: { route: true },
    });
    return toApiRow(updated);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.tour.delete({ where: { id } });
    return { message: 'Tour deleted successfully' };
  }
}
