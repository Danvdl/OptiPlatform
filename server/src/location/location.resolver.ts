import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LocationService } from './location.service';
import { Location } from './location.entity';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';

@Resolver(() => Location)
export class LocationResolver {
  constructor(private readonly service: LocationService) {}

  @Mutation(() => Location)
  @UseGuards(JwtAuthGuard)
  createLocation(@Args('data') data: CreateLocationInput) {
    return this.service.create(data);
  }

  @Mutation(() => Location)
  @UseGuards(JwtAuthGuard)
  updateLocation(@Args('data') data: UpdateLocationInput) {
    return this.service.update(data);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  removeLocation(@Args('id', { type: () => Int }) id: number) {
    return this.service.remove(id).then(() => true);
  }

  @Query(() => [Location])
  @UseGuards(JwtAuthGuard)
  locations() {
    return this.service.findAll();
  }

  @Query(() => Location, { nullable: true })
  @UseGuards(JwtAuthGuard)
  location(@Args('id', { type: () => Int }) id: number) {
    return this.service.find(id);
  }
}
