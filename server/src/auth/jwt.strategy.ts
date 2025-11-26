import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { LoggingService } from '../errors/logging.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
    
    const jwtSecret = configService.get<string>('JWT_SECRET');
    this.loggingService.logInfo('JWT Strategy initialized', { 
      module: 'JwtStrategy',
      metadata: { 
        secretConfigured: !!jwtSecret,
        secretLength: jwtSecret?.length,
        secretFirst10: jwtSecret?.substring(0, 10)
      }
    });
  }

  async validate(payload: any) {
    this.loggingService.logInfo('JWT Strategy validate called', {
      module: 'JwtStrategy',
      operation: 'validate',
      metadata: { payload, payloadKeys: Object.keys(payload) }
    });
    
    const user = { 
      id: payload.sub, 
      userId: payload.sub, 
      username: payload.username,
      tenantId: payload.tenantId,
      tenantRole: payload.tenantRole
    };
    
    this.loggingService.logInfo('JWT Strategy returning user', {
      module: 'JwtStrategy',
      operation: 'validate',
      metadata: { user, userKeys: Object.keys(user) }
    });
    
    return user;
  }
}
