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
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModeratorGuard } from '../auth/moderator.guard';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('tourId') tourId?: string) {
    return this.groupsService.findAll(tourId ? parseInt(tourId) : undefined);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }

  @Post()
  @UseGuards(ModeratorGuard)
  async create(@Body() body: any) {
    return this.groupsService.create(body);
  }

  @Put(':id')
  @UseGuards(ModeratorGuard)
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.groupsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(ModeratorGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.remove(id);
  }
}
