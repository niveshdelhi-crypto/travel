import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { SkipCsrf } from "../common/decorators/skip-csrf.decorator";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { CreateLeadNoteDto, UpdateLeadDto, UpdateLeadStatusDto } from "./dto/update-lead.dto";
import { LeadsService } from "./leads.service";

@Controller("leads")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Public()
  @SkipCsrf()
  @Post("public")
  createPublic(
    @Body() dto: CreateLeadDto,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Req() request: Request & { requestId?: string },
  ) {
    return this.leadsService.createFromLandingPage(dto, {
      idempotencyKey,
      requestId: request.requestId,
    });
  }

  @Post()
  async create(
    @Body() dto: CreateLeadDto,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Req() request: Request & { requestId?: string },
  ) {
    return this.leadsService.createFromLandingPage(dto, {
      idempotencyKey,
      requestId: request.requestId,
    });
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 25,
    @Query("status") status?: string,
  ) {
    return this.leadsService.listForUser(user, { page, pageSize, status });
  }

  @Get("my")
  listMy(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 25,
    @Query("status") status?: string,
  ) {
    return this.leadsService.listMyLeads(user, { page, pageSize, status });
  }

  @Roles("admin")
  @Get("admin")
  listAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 25,
    @Query("status") status?: string,
  ) {
    return this.leadsService.listAdminLeads(user, { page, pageSize, status });
  }

  @Get("metrics")
  metrics(@CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.metrics(user);
  }

  @Get(":id")
  getOne(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.getOne(id, user);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateStatus(id, user, dto.status);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(id, user, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.remove(id, user);
  }

  @Post(":id/notes")
  addNote(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLeadNoteDto,
  ) {
    return this.leadsService.addNote(id, user, dto);
  }

  @Post(":id/calls")
  recordCall(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.recordCall(id, user);
  }
}
