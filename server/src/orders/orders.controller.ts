import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModeratorGuard } from '../auth/moderator.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Req() req: any, @Body() body: { tourId: number; groupId?: number }) {
    const userId = req.user.id;
    return this.ordersService.createOrder(userId, body.tourId, body.groupId);
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.id;
    const isAdminOrModerator = req.user.role === 'admin' || req.user.role === 'moderator';
    return this.ordersService.findAll(userId, isAdminOrModerator);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;
    const isAdminOrModerator = req.user.role === 'admin' || req.user.role === 'moderator';
    return this.ordersService.findOne(id, userId, isAdminOrModerator);
  }

  @Put(':id/status')
  @UseGuards(ModeratorGuard)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' },
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.ordersService.updateStatus(id, body.status, userId, true);
  }

  @Post(':id/cancel')
  async cancel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;
    const isAdminOrModerator = req.user.role === 'admin' || req.user.role === 'moderator';
    return this.ordersService.cancel(id, userId, isAdminOrModerator);
  }

  @Delete(':id')
  @UseGuards(ModeratorGuard)
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;
    const isAdminOrModerator = req.user.role === 'admin' || req.user.role === 'moderator';
    return this.ordersService.remove(id, userId, isAdminOrModerator);
  }
}


