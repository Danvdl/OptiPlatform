import { Module, Global } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { DatabaseErrorHandler } from './database-error-handler';

@Global()
@Module({
  providers: [
    LoggingService,
    {
      provide: 'DATABASE_ERROR_HANDLER',
      useClass: DatabaseErrorHandler,
    },
  ],
  exports: [LoggingService, 'DATABASE_ERROR_HANDLER'],
})
export class ErrorHandlingModule {}
