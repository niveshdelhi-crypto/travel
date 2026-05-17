import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { SkipCsrf } from "../common/decorators/skip-csrf.decorator";
import { AuthService } from "./auth.service";
import { RefreshDto } from "./dto/refresh.dto";
import { LoginDto } from "./dto/login.dto";
import type { AuthenticatedUser } from "./types/authenticated-user";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get("csrf")
  csrf(@Res({ passthrough: true }) response: Response) {
    return this.authService.issueCsrf(response);
  }

  @Public()
  @SkipCsrf()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post("login")
  login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(dto, request, response);
  }

  @Public()
  @SkipCsrf()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post("refresh")
  refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: RefreshDto,
  ) {
    return this.authService.refresh(request, response, dto?.refresh_token);
  }

  @SkipCsrf()
  @Post("logout")
  logout(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) response: Response) {
    return this.authService.logout(user, response);
  }

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user);
  }
}
