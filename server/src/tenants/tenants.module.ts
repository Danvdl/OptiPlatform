import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantsService } from './tenants.service';
import { TenantsResolver } from './tenants.resolver';
import { Tenant } from './entities/tenant.entity';
import { User } from '../user/user.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User]),
    UserModule,
    forwardRef(() => AuthModule), // Import AuthModule instead of providing AuthService directly
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TenantsService, TenantsResolver], // Remove AuthService from providers
  exports: [TenantsService],
})
export class TenantsModule {}
