import { DATABASE_URL, requireEnv } from "@/shared/lib/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "server-only";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

function _createDb() {
  const url = DATABASE_URL ?? requireEnv("DATABASE_URL"); // runtime check
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
}

// Lazy proxy that only initializes DB when accessed - this is the main export
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = new Proxy({} as any, {
  get(target, prop) {
    if (!_db) _db = _createDb();
    return _db[prop as keyof typeof _db];
  },
});

// Backward compatibility alias
export const dbCompat = db;

export * from "./schema";
