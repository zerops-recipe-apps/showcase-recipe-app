import postgres from "postgres";
import { config } from "../config";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const db = postgres({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export async function initDb() {
  // Try bundled path first (dist/index.js → ../src/db/schema.sql), then source path
  const bundledPath = join(process.cwd(), "src/db/schema.sql");
  const sourcePath = join(import.meta.dir, "schema.sql");
  const schemaPath = existsSync(bundledPath) ? bundledPath : sourcePath;
  const schema = readFileSync(schemaPath, "utf-8");
  await db.unsafe(schema);
}
