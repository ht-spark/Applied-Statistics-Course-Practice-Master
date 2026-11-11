import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService, COOKIE_NAME } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.register(dto);
    const token = this.authService.generateToken(user.id);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.login(dto);
    const token = this.authService.generateToken(user.id);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      path: '/',
    });

    return { success: true };
  }

  @Get('me')
  async getMe(@Req() req: Request) {
    const token = req.cookies?.kaoyan_token ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return { user: null };
    }

    try {
      const userId = this.authService.verifyToken(token);
      const user = await this.authService.getCurrentUser(userId);
      return { user };
    } catch {
      return { user: null };
    }
  }
}
