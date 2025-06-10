import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Resolver()
export class NotificationsResolver {
  constructor(private readonly notifications: NotificationsService) {}

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  registerDeviceToken(@Args('token') token: string, @Context() ctx: any) {
    const userId = ctx.req.user?.userId;
    this.notifications.registerToken(token, userId);
    return true;
  }
}
