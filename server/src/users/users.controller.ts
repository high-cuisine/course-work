import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(
    @Body()
    body: { name: string; password: string; role?: 'user' | 'admin' | 'moderator' },
  ) {
    const user = await this.usersService.create(body.name, body.password, body.role ?? 'user');
    const token = await this.authService.signToken(user.id, user.name, user.role);
    return { token };
  }

  @Post('login')
  async login(@Body() body: { name: string; password: string }) {
    const token = await this.authService.validateUserAndSign(body.name, body.password);
    return { token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      balance: user.balance,
      createdAt: user.createdAt,
    };
  }

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      balance: user.balance,
      createdAt: user.createdAt,
    };
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { role?: string; balance?: number; password?: string },
  ) {
    return this.usersService.update(id, body);
  }

  @Put(':id/balance')
  @UseGuards(AdminGuard)
  async updateBalance(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { amount: number },
  ) {
    return this.usersService.updateBalance(id, body.amount);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}


