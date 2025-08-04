import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { User } from './user.entity';
import { UserPermission } from './user-permission.entity';
import { ActivityLog } from './activity-log.entity';
import { UserPreferences } from './user-preferences.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserPermission,
      ActivityLog,
      UserPreferences
    ])
  ],
  providers: [UserService, UserResolver],
  exports: [UserService]
})
export class UserModule {}
