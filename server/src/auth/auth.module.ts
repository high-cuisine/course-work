import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from './roles.guard';
import { AdminGuard } from './admin.guard';
import { ModeratorGuard } from './moderator.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'devsecret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES ?? '7d' },
    }),
    forwardRef(() => UsersModule),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard, AdminGuard, ModeratorGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard, AdminGuard, ModeratorGuard],
})
export class AuthModule {}


