import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/context';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { appUsers } from '@server/database/schema';

import { getJwtSecret } from '../auth/auth.service';
const COOKIE_NAME = 'kaoyan_token';

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(data: Buffer): string {
  return data
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4;
  const full = pad === 0 ? padded : padded + '='.repeat(4 - pad);
  return Buffer.from(full, 'base64').toString('utf-8');
}

function hmacSha256(data: string, secret: string): string {
  return base64UrlEncode(createHmac('sha256', secret).update(data).digest());
}

function verifyToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const expectedSignature = hmacSha256(data, getJwtSecret());

    if (signatureB64.length !== expectedSignature.length ||
        !timingSafeEqual(Buffer.from(signatureB64), Buffer.from(expectedSignature))) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64)) as JwtPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      cookies: Record<string, string>;
      user?: { id: string; isAdmin: boolean };
    }>();

    const token = request.cookies?.[COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException('未登录');
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException('登录已失效');
    }

    const users = await this.db
      .select({ id: appUsers.id, isAdmin: appUsers.isAdmin })
      .from(appUsers)
      .where(eq(appUsers.id, payload.sub));

    if (users.length === 0) {
      throw new UnauthorizedException('用户不存在');
    }

    const user = users[0];
    if (!user.isAdmin) {
      throw new ForbiddenException('需要管理员权限');
    }

    request.user = { id: user.id, isAdmin: true };
    return true;
  }
}
