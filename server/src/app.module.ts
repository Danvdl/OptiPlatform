import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { AppResolver } from './app.resolver';
import { User } from './user/user.entity';
import { UserPermission } from './user/user-permission.entity';
import { ActivityLog } from './user/activity-log.entity';
import { UserPreferences } from './user/user-preferences.entity';
import { UserModule } from './user/user.module';
import { InventoryModule } from './inventory/inventory.module';
import { Product } from './inventory/entities/product.entity';
import { Category } from './inventory/entities/category.entity';
import { ProductNote } from './inventory/entities/product-note.entity';
import { InventoryTransaction } from './inventory/entities/inventory-transaction.entity';
import { PriceHistory } from './inventory/entities/price-history.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { DeviceToken } from './notifications/entities/device-token.entity';
import { AppError, ErrorCode } from './errors/error-codes';
import { ErrorHandlingModule } from './errors/error-handling.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ErrorHandlingModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      context: ({ req }) => {
        console.log('🔍 GraphQL Context - Request headers:', {
          authorization: req.headers?.authorization,
          'content-type': req.headers?.['content-type'],
          'user-agent': req.headers?.['user-agent'],
          allHeaderKeys: Object.keys(req.headers || {})
        });
        return { req };
      },
      formatError: (error: GraphQLError) => {
        const original: any = error.originalError;
        if (original instanceof AppError) {
          return { message: original.message, extensions: { code: original.code } };
        }
        return { message: error.message, extensions: { code: ErrorCode.UNKNOWN } };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const ormConfig: any = {
          type: 'postgres',
          url: config.get<string>('DB_URL'),
          entities: [User, UserPermission, ActivityLog, UserPreferences, Product, Category, ProductNote, InventoryTransaction, PriceHistory, DeviceToken],
          // Automatically load entities registered via TypeOrmModule.forFeature across modules
          autoLoadEntities: true,
          synchronize: false, // Temporarily disabled to avoid schema conflicts
          schema: 'public', // Explicitly use public schema to avoid auth.users conflict
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
    UserModule,
    InventoryModule,
    NotificationsModule,
    ReportsModule,
    SuppliersModule,
    TypeOrmModule.forFeature([User, UserPermission, ActivityLog, UserPreferences, Product, Category, ProductNote, InventoryTransaction, PriceHistory, DeviceToken]),
  ],
  providers: [AppResolver],
})
export class AppModule {}
