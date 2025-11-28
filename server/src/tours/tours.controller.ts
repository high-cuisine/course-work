import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ToursService } from './tours.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModeratorGuard } from '../auth/moderator.guard';

@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('country') country?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('hotelStars') hotelStars?: string,
    @Query('transport') transport?: string,
    @Query('meals') meals?: string,
  ) {
    const filters: any = {};
    if (country) filters.country = country;
    if (minAmount) filters.minAmount = parseInt(minAmount);
    if (maxAmount) filters.maxAmount = parseInt(maxAmount);
    if (hotelStars) filters.hotelStars = parseInt(hotelStars);
    if (transport) filters.transport = transport;
    if (meals) filters.meals = meals;
    return this.toursService.findAll(Object.keys(filters).length > 0 ? filters : undefined);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.findOne(id);
  }

  @Post()
  @UseGuards(ModeratorGuard)
  async create(@Body() body: any) {
    return this.toursService.create(body);
  }

  @Put(':id')
  @UseGuards(ModeratorGuard)
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.toursService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(ModeratorGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.remove(id);
  }
}
