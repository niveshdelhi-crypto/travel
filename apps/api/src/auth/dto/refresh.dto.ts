import { IsOptional, IsString, MinLength } from "class-validator";

/** Optional body refresh for SPAs when HttpOnly cookie does not persist (proxied frontend host). */
export class RefreshDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  refresh_token?: string;
}
