import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateMarketplaceSupplierDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  website_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logo_url?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
