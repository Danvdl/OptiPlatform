import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.users.findOne({ where: { username } });
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async registerUser(username: string, pass: string) {
    const hashed = await bcrypt.hash(pass, 10);
    const user = this.users.create({ username, password: hashed });
    const saved = await this.users.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };
    return this.jwtService.sign(payload);
  }

  async oauthLogin(user: any) {
    const payload = {
      sub: user.email || user.username,
      ...user,
    };
    return this.jwtService.sign(payload);
  }
}
