import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUserAndSign(name: string, password: string): Promise<string> {
    const user = await this.usersService.findByName(name);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.signToken(user.id, user.name, user.role);
  }

  async signToken(id: number, name: string, role: string): Promise<string> {
    const payload = { sub: id, name, role };
    return await this.jwtService.signAsync(payload);
  }
}


