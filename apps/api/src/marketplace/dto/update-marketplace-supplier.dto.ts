import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class UpdateMarketplaceSupplierDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  website_url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logo_url?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
