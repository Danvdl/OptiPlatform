import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './location.entity';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private locations: Repository<Location>,
  ) {}

  create(data: CreateLocationInput) {
    return this.locations.save(this.locations.create(data));
  }

  update(data: UpdateLocationInput) {
    return this.locations.save(data);
  }

  remove(id: number) {
    return this.locations.delete(id);
  }

  findAll() {
    return this.locations.find();
  }

  find(id: number) {
    return this.locations.findOneBy({ id });
  }
}
