import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AppError, ErrorCode } from '../errors/error-codes';
import { DatabaseErrorHandler, HandleDatabaseErrors } from '../errors/database-error-handler';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    if (!username || !pass) {
      throw new AppError(ErrorCode.VALIDATION, 'Username and password are required');
    }

    try {
      console.log('🔍 Validating user:', { username, hasPassword: !!pass });
      const user = await this.users.findOne({ 
        where: { username },
        select: ['id', 'username', 'email', 'role', 'password', 'tenantId', 'tenantRole']
      });
      console.log('🔍 Found user:', { found: !!user, hasPassword: !!user?.password });
      
      if (!user) {
        console.log('🔍 User not found');
        return null;
      }
      
      const isMatch = await bcrypt.compare(pass, user.password);
      console.log('🔍 Password validation:', { isMatch });
      
      if (isMatch) {
        const { password, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error in validateUser:', error);
      if (DatabaseErrorHandler.isConnectionError(error)) {
        throw new AppError(ErrorCode.DB_ERROR, 'Authentication service temporarily unavailable');
      }
      throw new AppError(ErrorCode.AUTH_INVALID, 'Authentication failed');
    }
  }

  @HandleDatabaseErrors()
  async registerUser(username: string, pass: string, email?: string) {
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
    const existingUser = await this.users.findOne({ 
      where: [
        { username },
        ...(email ? [{ email }] : [])
      ]
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        throw new AppError(ErrorCode.VALIDATION, 'Username already exists');
      }
      if (existingUser.email === email) {
        throw new AppError(ErrorCode.VALIDATION, 'Email already exists');
      }
    }

    const hashed = await bcrypt.hash(pass, 10);
    const user = this.users.create({ 
      username, 
      password: hashed,
      email: email || `${username}@example.com`,
      role: UserRole.STAFF
    });
    const saved = await this.users.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async login(user: any) {
    if (!user || !user.username || !user.id) {
      throw new AppError(ErrorCode.AUTH_INVALID, 'Invalid user data for login');
    }

    try {
      console.log('🔑 Login JWT_SECRET info:', {
        hasSecret: !!process.env.JWT_SECRET,
        secretLength: process.env.JWT_SECRET?.length,
        secretFirst10: process.env.JWT_SECRET?.substring(0, 10)
      });
      
      // Update last login time and log activity
      await this.userService.updateLastLogin(user.id);
      
      // Include tenantId in JWT payload
      const payload = { 
        username: user.username, 
        sub: user.id,
        tenantId: user.tenantId,
        tenantRole: user.tenantRole 
      };
      console.log('🔑 Login payload:', payload);
      const token = this.jwtService.sign(payload);
      console.log('🔑 Generated token:', token.substring(0, 50) + '...');
      return token;
    } catch (error) {
      console.log('Error in login method:', error);
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

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
