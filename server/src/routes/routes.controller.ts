import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModeratorGuard } from '../auth/moderator.guard';

@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.routesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.routesService.findOne(id);
  }

  @Post()
  @UseGuards(ModeratorGuard)
  async create(@Body() body: { place: string; duration: number }) {
    return this.routesService.create(body);
  }

  @Put(':id')
  @UseGuards(ModeratorGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { place?: string; duration?: number },
  ) {
    return this.routesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(ModeratorGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.routesService.remove(id);
  }
}
