import { ObjectType, Field } from '@nestjs/graphql';
import { Tenant } from '../entities/tenant.entity';
import { User } from '../../user/user.entity';

@ObjectType()
export class RegisterTenantResponse {
  @Field()
  accessToken: string;

  @Field(() => Tenant)
  tenant: Tenant;

  @Field(() => User)
  user: User;

  @Field()
  message: string;
}

@ObjectType()
export class TenantSettingsResponse {
  @Field(() => Tenant)
  tenant: Tenant;

  @Field()
  totalUsers: number;

  @Field()
  totalProducts: number;

  @Field()
  storageUsed: number;

  @Field({ nullable: true })
  daysUntilTrialEnds?: number;
}

@ObjectType()
export class TeamMemberResponse {
  @Field(() => User)
  user: User;

  @Field({ nullable: true })
  invitationSent?: boolean;
}
