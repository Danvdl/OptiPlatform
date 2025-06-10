import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { AppResolver } from './app.resolver';
import { User } from './user/user.entity';
import { InventoryModule } from './inventory/inventory.module';
import { Product } from './inventory/entities/product.entity';
import { InventoryTransaction } from './inventory/entities/inventory-transaction.entity';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    GraphQLModule.forRoot({
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'mydb',
      entities: [User, Product, InventoryTransaction],
      synchronize: true,
    }),
    AuthModule,
    InventoryModule,
    NotificationsModule,
    TypeOrmModule.forFeature([User, Product, InventoryTransaction]),
  ],
  providers: [AppResolver],
})
export class AppModule {}
