import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantsService } from './tenants.service';
import { TenantsResolver } from './tenants.resolver';
import { Tenant } from './entities/tenant.entity';
import { User } from '../user/user.entity';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TenantsService, TenantsResolver, AuthService, UserService],
  exports: [TenantsService],
})
export class TenantsModule {}
