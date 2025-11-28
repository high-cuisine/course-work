import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { RoutesModule } from './routes/routes.module';
import { ToursModule } from './tours/tours.module';
import { GroupsModule } from './groups/groups.module';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    OrdersModule,
    RoutesModule,
    ToursModule,
    GroupsModule,
    ClientsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
