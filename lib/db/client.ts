import { Pool } from "pg";
import { getDatabaseEnv, shouldUseDatabaseSsl } from "@/lib/db/env";

const globalForPg = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

export function getDbPool() {
  if (!globalForPg.pgPool) {
    const { databaseUrl } = getDatabaseEnv();
    globalForPg.pgPool = new Pool({
      connectionString: databaseUrl,
      ssl: shouldUseDatabaseSsl(databaseUrl)
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  return globalForPg.pgPool;
}
