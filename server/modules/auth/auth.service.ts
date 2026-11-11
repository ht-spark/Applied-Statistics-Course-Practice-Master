import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';

import { appUsers } from '@server/database/schema';
import { RegisterDto, LoginDto } from './auth.dto';

export const JWT_SECRET = 'kaoyan-app-secret-key';
export const COOKIE_NAME = 'kaoyan_token';
const TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

export interface AppUser {
  id: string;
  email: string;
  nickname: string;
  isAdmin: boolean;
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  return Buffer.from(padded, 'base64').toString('utf-8');
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async register(dto: RegisterDto): Promise<AppUser> {
    const normalizedEmail = dto.email.toLowerCase();

    const existing = await this.db
      .select({ id: appUsers.id })
      .from(appUsers)
      .where(eq(appUsers.email, normalizedEmail));

    if (existing.length > 0) {
      throw new ConflictException('邮箱已被注册');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const inserted = await this.db
      .insert(appUsers)
      .values({
        email: normalizedEmail,
        passwordHash,
        nickname: dto.nickname,
      })
      .returning({
        id: appUsers.id,
        email: appUsers.email,
        nickname: appUsers.nickname,
        isAdmin: appUsers.isAdmin,
      });

    if (inserted.length === 0) {
      throw new Error('注册失败');
    }

    return inserted[0];
  }

  async login(dto: LoginDto): Promise<AppUser> {
    const normalizedEmail = dto.email.toLowerCase();

    const users = await this.db
      .select({
        id: appUsers.id,
        email: appUsers.email,
        passwordHash: appUsers.passwordHash,
        nickname: appUsers.nickname,
        isAdmin: appUsers.isAdmin,
      })
      .from(appUsers)
      .where(eq(appUsers.email, normalizedEmail));

    if (users.length === 0) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      isAdmin: user.isAdmin,
    };
  }

  async getCurrentUser(userId: string): Promise<AppUser> {
    const users = await this.db
      .select({
        id: appUsers.id,
        email: appUsers.email,
        nickname: appUsers.nickname,
        isAdmin: appUsers.isAdmin,
      })
      .from(appUsers)
      .where(eq(appUsers.id, userId));

    if (users.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    return users[0];
  }

  /**
   * Generate a JWT token using HMAC SHA256 (via node:crypto).
   */
  generateToken(userId: string): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: userId,
      iat: now,
      exp: now + TOKEN_EXPIRES_IN,
    };

    const encodedHeader = base64UrlEncode(Buffer.from(JSON.stringify(header)));
    const encodedPayload = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const signature = base64UrlEncode(
      crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest(),
    );

    return `${signingInput}.${signature}`;
  }

  /**
   * Verify and decode a JWT token.
   * Returns userId if valid, throws UnauthorizedException otherwise.
   */
  verifyToken(token: string): string {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('无效的令牌格式');
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;

    const expectedSignature = base64UrlEncode(
      crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest(),
    );

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signatureB64),
        Buffer.from(expectedSignature),
      )
    ) {
      throw new UnauthorizedException('令牌签名无效');
    }

    let payload: { sub: string; exp?: number };
    try {
      payload = JSON.parse(base64UrlDecode(payloadB64));
    } catch {
      throw new UnauthorizedException('令牌内容无效');
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('令牌缺少用户标识');
    }

    return payload.sub;
  }
}
