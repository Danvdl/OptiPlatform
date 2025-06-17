import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const ormConfig: any = {
          type: 'postgres',
          url: config.get<string>('DB_URL'),
          entities: [User, Product, InventoryTransaction, Location, DeviceToken],
          synchronize: config.get<string>('NODE_ENV') === 'development',
        };

        const rejectUnauthorized = config.get<string>('DB_SSL_REJECT_UNAUTHORIZED');
        if (rejectUnauthorized !== undefined) {
          ormConfig.ssl = {
            rejectUnauthorized: rejectUnauthorized === 'true',
          };
        }

        return ormConfig;
      },
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
