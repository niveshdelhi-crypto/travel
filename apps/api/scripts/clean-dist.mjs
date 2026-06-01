import { rmSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");

try {
  rmSync(dist, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  console.log(`Removed ${dist}`);
} catch (error) {
  console.error("Could not remove dist — stop other Node/Nest processes and retry.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
