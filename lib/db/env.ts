export type DatabaseEnv = {
  databaseUrl: string;
};

export function getDatabaseEnv(): DatabaseEnv {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl && process.env.NEXT_PHASE === "phase-production-build") {
    return { databaseUrl: "postgresql://localhost:5432/rpg_english_learning" };
  }
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable");
  }
  return { databaseUrl };
}

export function shouldUseDatabaseSsl(databaseUrl: string) {
  return !databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1");
}
