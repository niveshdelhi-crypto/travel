import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StoredDocumentKind } from "@prisma/client";
import { promises as fs } from "fs";
import { join } from "path";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DocumentStorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get uploadDir() {
    return this.config.get<string>("DOCUMENT_UPLOAD_DIR") ?? join(process.cwd(), "uploads");
  }

  private get publicBaseUrl() {
    return (
      this.config.get<string>("PUBLIC_API_BASE_URL") ??
      `http://localhost:${this.config.get("PORT") ?? 4000}`
    ).replace(/\/$/, "");
  }

  async storeLocalFile(sourcePath: string, storageKey: string, fileName: string) {
    const targetDir = join(this.uploadDir, "documents");
    await fs.mkdir(targetDir, { recursive: true });
    const targetPath = join(targetDir, fileName);
    await fs.copyFile(sourcePath, targetPath);

    const publicUrl = `${this.publicBaseUrl}/api/booking-operations/documents/${encodeURIComponent(fileName)}`;

    return { storageKey, publicUrl, localPath: targetPath };
  }

  async record(input: {
    kind: StoredDocumentKind;
    referenceId: string;
    fileName: string;
    storageKey: string;
    publicUrl?: string;
    byteSize?: number;
  }) {
    return this.prisma.storedDocument.create({
      data: {
        kind: input.kind,
        reference_id: input.referenceId,
        file_name: input.fileName,
        storage_key: input.storageKey,
        public_url: input.publicUrl ?? null,
        byte_size: input.byteSize ?? null,
      },
    });
  }

  resolveLocalPath(fileName: string) {
    return join(this.uploadDir, "documents", fileName);
  }
}
