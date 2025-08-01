import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity';
import { AppError, ErrorCode } from '../errors/error-codes';
import { DatabaseErrorHandler, HandleDatabaseErrors } from '../errors/database-error-handler';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    if (!username || !pass) {
      throw new AppError(ErrorCode.VALIDATION, 'Username and password are required');
    }

    try {
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
    } catch (error) {
      if (DatabaseErrorHandler.isConnectionError(error)) {
        throw new AppError(ErrorCode.DB_ERROR, 'Authentication service temporarily unavailable');
      }
      throw new AppError(ErrorCode.AUTH_INVALID, 'Authentication failed');
    }
  }

  @HandleDatabaseErrors()
  async registerUser(username: string, pass: string) {
    // Validate input
    if (!username || !pass) {
      throw new AppError(ErrorCode.VALIDATION, 'Username and password are required');
    }

    if (username.length < 3) {
      throw new AppError(ErrorCode.VALIDATION, 'Username must be at least 3 characters long');
    }

    if (pass.length < 6) {
      throw new AppError(ErrorCode.VALIDATION, 'Password must be at least 6 characters long');
    }

    // Check if user already exists
    const existingUser = await this.users.findOne({ where: { username } });
    if (existingUser) {
      throw new AppError(ErrorCode.VALIDATION, 'Username already exists');
    }

    const hashed = await bcrypt.hash(pass, 10);
    const user = this.users.create({ username, password: hashed });
    const saved = await this.users.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async login(user: any) {
    if (!user || !user.username || !user.id) {
      throw new AppError(ErrorCode.AUTH_INVALID, 'Invalid user data for login');
    }

    try {
      const payload = { username: user.username, sub: user.id };
      return this.jwtService.sign(payload);
    } catch (error) {
      throw new AppError(ErrorCode.AUTH_INVALID, 'Failed to generate authentication token');
    }
  }

  async oauthLogin(user: any) {
    if (!user || !user.id) {
      throw new AppError(ErrorCode.AUTH_INVALID, 'Invalid OAuth user data');
    }

    try {
      const payload = {
        sub: user.id,
        ...user,
      };
      return this.jwtService.sign(payload);
    } catch (error) {
      throw new AppError(ErrorCode.AUTH_INVALID, 'Failed to generate OAuth authentication token');
    }
  }
}
