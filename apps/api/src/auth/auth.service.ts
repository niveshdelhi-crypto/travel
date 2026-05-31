import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomBytes, randomUUID } from "crypto";
import { Request, Response } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import {
  accessCookieOptions,
  csrfCookieOptions,
  refreshCookieOptions,
  type CookieConfig,
} from "./cookie-options";
import type { LoginDto } from "./dto/login.dto";
import type { AuthenticatedUser } from "./types/authenticated-user";

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async login(dto: LoginDto, request: Request, response: Response) {
    const user = await this.users.findByEmail(dto.email);

    if (!user || !user.is_active) throw new UnauthorizedException("Invalid credentials");

    const passwordMatches = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordMatches) throw new UnauthorizedException("Invalid credentials");

    const sessionId = randomUUID();
    const refreshTokenSecret = this.createOpaqueToken();
    const refreshToken = this.formatRefreshToken(sessionId, refreshTokenSecret);
    const refreshTokenHash = await this.hashToken(refreshTokenSecret);
    const refreshTtlDays = this.refreshTtlDays;
    const expiresAt = new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000);

    const session = await this.prisma.refreshSession.create({
      data: {
        id: sessionId,
        user_id: user.id,
        refresh_token_hash: refreshTokenHash,
        user_agent: request.header("user-agent"),
        ip_address: request.ip,
        expires_at: expiresAt,
      },
    });

    const accessToken = await this.signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    this.setAuthCookies(response, accessToken, refreshToken);
    this.setCsrfCookie(response);

    return {
      user: this.toSafeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refresh(request: Request, response: Response, refreshFromBody?: string) {
    const refreshTokenRaw = request.cookies?.refresh_token ?? refreshFromBody?.trim();
    if (!refreshTokenRaw) throw new UnauthorizedException("Missing refresh token");

    const parsedRefreshToken = this.parseRefreshToken(refreshTokenRaw);
    if (!parsedRefreshToken) throw new UnauthorizedException("Invalid refresh token");

    const session = await this.prisma.refreshSession.findFirst({
      where: {
        id: parsedRefreshToken.sessionId,
        revoked_at: null,
        expires_at: { gt: new Date() },
        user: { is_active: true },
      },
      include: { user: true },
    });

    if (!session) throw new UnauthorizedException("Invalid refresh token");

    const tokenMatches = await bcrypt.compare(parsedRefreshToken.secret, session.refresh_token_hash);
    if (!tokenMatches) {
      await this.prisma.refreshSession.updateMany({
        where: { id: parsedRefreshToken.sessionId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
      throw new UnauthorizedException("Invalid refresh token");
    }

    const nextSessionId = randomUUID();
    const nextRefreshTokenSecret = this.createOpaqueToken();
    const nextRefreshToken = this.formatRefreshToken(nextSessionId, nextRefreshTokenSecret);
    const nextRefreshTokenHash = await this.hashToken(nextRefreshTokenSecret);
    const nextExpiresAt = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);

    const nextSession = await this.prisma.$transaction(async (tx) => {
      await tx.refreshSession.update({
        where: { id: session.id },
        data: {
          rotated_at: new Date(),
          revoked_at: new Date(),
        },
      });

      return tx.refreshSession.create({
        data: {
          id: nextSessionId,
          user_id: session.user_id,
          refresh_token_hash: nextRefreshTokenHash,
          user_agent: request.header("user-agent"),
          ip_address: request.ip,
          expires_at: nextExpiresAt,
        },
      });
    });

    const accessToken = await this.signAccessToken({
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      sessionId: nextSession.id,
    });

    this.setAuthCookies(response, accessToken, nextRefreshToken);
    this.setCsrfCookie(response);

    return {
      user: this.toSafeUser(session.user),
      accessToken,
      refreshToken: nextRefreshToken,
    };
  }

  async logout(user: AuthenticatedUser | undefined, response: Response) {
    if (user?.sessionId) {
      await this.prisma.refreshSession.updateMany({
        where: { id: user.sessionId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    }

    this.clearAuthCookies(response);
    return { success: true };
  }

  async me(user: AuthenticatedUser) {
    return this.users.findActiveById(user.id);
  }

  issueCsrf(response: Response) {
    const csrfToken = this.createOpaqueToken(32);
    response.cookie("csrf_token", csrfToken, csrfCookieOptions(this.cookieConfig));
    return { csrfToken };
  }

  private async signAccessToken(user: AuthenticatedUser) {
    return this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        sid: user.sessionId,
      },
      {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: this.accessTtlSeconds,
      },
    );
  }

  private setAuthCookies(response: Response, accessToken: string, refreshToken: string) {
    response.cookie("access_token", accessToken, accessCookieOptions(this.cookieConfig));
    response.cookie("refresh_token", refreshToken, refreshCookieOptions(this.cookieConfig));
  }

  private clearAuthCookies(response: Response) {
    response.clearCookie("access_token", accessCookieOptions(this.cookieConfig));
    response.clearCookie("refresh_token", refreshCookieOptions(this.cookieConfig));
    response.clearCookie("csrf_token", csrfCookieOptions(this.cookieConfig));
  }

  private setCsrfCookie(response: Response) {
    const csrfToken = this.createOpaqueToken(32);
    response.cookie("csrf_token", csrfToken, csrfCookieOptions(this.cookieConfig));
  }

  private createOpaqueToken(bytes = 64) {
    return randomBytes(bytes).toString("base64url");
  }

  private formatRefreshToken(sessionId: string, secret: string) {
    return `${sessionId}.${secret}`;
  }

  private parseRefreshToken(token: string) {
    const [sessionId, secret] = token.split(".");
    if (!sessionId || !secret) return null;
    return { sessionId, secret };
  }

  private hashToken(token: string) {
    const rounds = Number(this.config.get<string>("BCRYPT_ROUNDS") ?? 12);
    return bcrypt.hash(token, Number.isFinite(rounds) && rounds >= 4 ? rounds : 12);
  }

  private toSafeUser(user: { id: string; name: string; email: string; role: string; is_active: boolean; created_at: Date }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
    };
  }

  private get accessTtlSeconds(): number {
    const raw = this.config.get<string | number>("ACCESS_TOKEN_TTL_SECONDS", 900);
    const parsed = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 900;
  }

  private get refreshTtlDays() {
    return this.config.get<number>("REFRESH_TOKEN_TTL_DAYS", 30);
  }

  private get cookieConfig(): CookieConfig {
    const sameSiteRaw = this.config.get<string>("COOKIE_SAME_SITE")?.trim().toLowerCase();
    const parsedSameSite =
      sameSiteRaw === "none" || sameSiteRaw === "strict" || sameSiteRaw === "lax"
        ? sameSiteRaw
        : undefined;

    return {
      nodeEnv: this.config.get<string>("NODE_ENV", "development"),
      domain: this.config.get<string>("COOKIE_DOMAIN") || undefined,
      accessTtlSeconds: this.accessTtlSeconds,
      refreshTtlDays: this.refreshTtlDays,
      ...(parsedSameSite !== undefined ? { sameSite: parsedSameSite } : {}),
    };
  }
}
