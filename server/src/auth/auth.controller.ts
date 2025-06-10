import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Google authentication redirect
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req) {
    return this.authService.oauthLogin(req.user);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // GitHub authentication redirect
  }

  @Get('github/redirect')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req) {
    return this.authService.oauthLogin(req.user);
  }
}
