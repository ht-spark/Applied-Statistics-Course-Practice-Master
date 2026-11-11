import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

declare module 'express' {
  interface Request {
    userId?: string;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.kaoyan_token ||
      request.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      throw new UnauthorizedException('未登录');
    }

    const userId = this.authService.verifyToken(token);
    request.userId = userId;
    return true;
  }
}
