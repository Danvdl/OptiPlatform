import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { LoggingService } from '../errors/logging.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly loggingService: LoggingService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
    this.loggingService.logInfo('JWT Strategy initialized', { 
      module: 'JwtStrategy',
      metadata: { 
        secretConfigured: !!process.env.JWT_SECRET,
        secretLength: process.env.JWT_SECRET?.length,
        secretFirst10: process.env.JWT_SECRET?.substring(0, 10)
      }
    });
  }

  async validate(payload: any) {
    this.loggingService.logInfo('JWT Strategy validate called', {
      module: 'JwtStrategy',
      operation: 'validate',
      metadata: { payload, payloadKeys: Object.keys(payload) }
    });
    
    const user = { id: payload.sub, userId: payload.sub, username: payload.username };
    
    this.loggingService.logInfo('JWT Strategy returning user', {
      module: 'JwtStrategy',
      operation: 'validate',
      metadata: { user, userKeys: Object.keys(user) }
    });
    
    return user;
  }
}
