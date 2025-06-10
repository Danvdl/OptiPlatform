import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    ConfigModule.forRoot(),
    GraphQLModule.forRoot({
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
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
