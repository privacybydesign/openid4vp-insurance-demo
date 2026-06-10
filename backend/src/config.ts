function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`missing required env var: ${name}`)
  return v
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback
}

export const config = {
  port: Number.parseInt(optional("PORT", "3001"), 10),
  dbFile: optional("DB_FILE", "./data/db.json"),
  dbSeedFile: optional("DB_SEED_FILE", "./db.seed.json"),

  veramoIssuer: {
    internalUrl: optional("VERAMO_ISSUER_URL_INTERNAL", "http://localhost:8081"),
    externalUrl: optional("VERAMO_ISSUER_URL_EXTERNAL", "http://localhost:8081"),
    name: optional("VERAMO_ISSUER_NAME", "test-issuer"),
    adminToken: optional("VERAMO_ISSUER_ADMIN_TOKEN", "veramo-issuer-admin-token"),
  },

  veramoVerifier: {
    internalUrl: optional("VERAMO_VERIFIER_URL_INTERNAL", "http://localhost:8082"),
    externalUrl: optional("VERAMO_VERIFIER_URL_EXTERNAL", "http://localhost:8082"),
    name: optional("VERAMO_VERIFIER_NAME", "test-verifier"),
    adminToken: optional("VERAMO_VERIFIER_ADMIN_TOKEN", "veramo-verifier-admin-token"),
  },

  eudi: {
    internalUrl: optional("EUDI_API_URL_INTERNAL", "http://localhost:8083"),
    externalUrl: optional("EUDI_API_URL_EXTERNAL", "http://localhost:8083"),
  },

  sessionTtlMs: 5 * 60 * 1000,
}
