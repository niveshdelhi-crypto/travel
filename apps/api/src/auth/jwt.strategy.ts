import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser } from "./types/authenticated-user";

type AccessTokenPayload = {
  sub: string;
  email: string;
  role: AuthenticatedUser["role"];
  sid: string;
};

function accessTokenExtractor(request: { cookies?: Record<string, string>; headers?: Record<string, string> }) {
  const bearer = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
  if (bearer) return bearer;
  const cookieToken = request.cookies?.access_token?.trim();
  return cookieToken || null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: accessTokenExtractor,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    const session = await this.prisma.refreshSession.findFirst({
      where: {
        id: payload.sid,
        user_id: payload.sub,
        revoked_at: null,
        expires_at: { gt: new Date() },
        user: { is_active: true },
      },
      include: { user: true },
    });

    if (!session) throw new UnauthorizedException("Invalid session");

    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      sessionId: session.id,
    };
  }
}
