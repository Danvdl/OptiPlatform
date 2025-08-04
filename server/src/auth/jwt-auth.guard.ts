import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { LoggingService } from '../errors/logging.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly loggingService: LoggingService) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    
    this.loggingService.logInfo('JwtAuthGuard getRequest called', {
      module: 'JwtAuthGuard',
      operation: 'getRequest',
      metadata: { 
        hasAuthHeader: !!req.headers?.authorization,
        authHeader: req.headers?.authorization?.substring(0, 20) + '...',
        allHeaders: Object.keys(req.headers || {})
      }
    });
    
    return req;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    this.loggingService.logInfo('JwtAuthGuard handleRequest called', {
      module: 'JwtAuthGuard',
      operation: 'handleRequest',
      metadata: { 
        hasError: !!err,
        error: err?.message,
        hasUser: !!user,
        user,
        info: info?.message || info
      }
    });
    
    return super.handleRequest(err, user, info, context);
  }
}

