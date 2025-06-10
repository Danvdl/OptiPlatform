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
import { Location } from './location/location.entity';
import { LocationModule } from './location/location.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DeviceToken } from './notifications/entities/device-token.entity';

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
      entities: [User, Product, InventoryTransaction, Location, DeviceToken],
      synchronize: true,
    }),
    AuthModule,
    InventoryModule,
    LocationModule,
    NotificationsModule,
    TypeOrmModule.forFeature([User, Product, InventoryTransaction, Location, DeviceToken]),
  ],
  providers: [AppResolver],
})
export class AppModule {}
