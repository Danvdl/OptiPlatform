import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';

@Resolver()
export class NotificationsResolver {
  constructor(private readonly notifications: NotificationsService) {}

  @Mutation(() => Boolean)
  registerDeviceToken(@Args('token') token: string) {
    this.notifications.registerToken(token);
    return true;
  }
}
