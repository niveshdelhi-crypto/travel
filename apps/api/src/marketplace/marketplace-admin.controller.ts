import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator";
import { CreateMarketplaceSupplierDto } from "./dto/create-marketplace-supplier.dto";
import { UpdateMarketplaceSupplierDto } from "./dto/update-marketplace-supplier.dto";
import { MarketplaceService } from "./marketplace.service";

@Controller("marketplace/admin/suppliers")
@Roles("admin")
export class MarketplaceAdminController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post()
  create(@Body() dto: CreateMarketplaceSupplierDto) {
    return this.marketplaceService.createSupplier(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateMarketplaceSupplierDto) {
    return this.marketplaceService.updateSupplier(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.marketplaceService.deleteSupplier(id).then(() => ({ ok: true }));
  }
}
