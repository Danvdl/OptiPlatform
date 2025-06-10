import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthResolver } from './auth.resolver';
import { GoogleStrategy } from './google.strategy';
import { GitHubStrategy } from './github.strategy';
import { AuthController } from './auth.controller';
import { User } from '../user/user.entity';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '60m' },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    AuthResolver,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
