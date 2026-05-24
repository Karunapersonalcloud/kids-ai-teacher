export type PersistenceProvider = "json" | "postgres";

export function getPersistenceProvider(): PersistenceProvider {
  if (process.env.PERSISTENCE_PROVIDER === "postgres" && Boolean(process.env.DATABASE_URL)) {
    return "postgres";
  }

  return "json";
}

export function isPostgresEnabled() {
  return getPersistenceProvider() === "postgres";
}
