import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => String)
  async login(@Args('data') loginInput: LoginInput) {
    const user = await this.authService.validateUser(
      loginInput.username,
      loginInput.password,
    );
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Mutation(() => String)
  async register(@Args('data') registerInput: RegisterInput) {
    const user = await this.authService.registerUser(
      registerInput.username,
      registerInput.password,
    );
    return this.authService.login(user);
  }
}
