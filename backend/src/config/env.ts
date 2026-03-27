export interface EnvConfig {
  auth: {
    domain: string;
    nonceTtlSeconds: number;
  };
  jwt: {
    secret: string;
    ttl: string;
    issuer: string;
    audience: string;
  };
  redis: {
    url: string;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  stellar: {
    rpcUrl: string;
    networkPassphrase: string;
    contractId: string;
  };
}

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config: EnvConfig = {
  auth: {
    domain: process.env.AUTH_DOMAIN || "localhost",
    nonceTtlSeconds: intFromEnv("AUTH_NONCE_TTL_SECONDS", 300),
  },
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    ttl: process.env.JWT_EXPIRES_IN || "1h",
    issuer: process.env.JWT_ISSUER || "niffyinsure",
    audience: process.env.JWT_AUDIENCE || "niffyinsure-api",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  },
  smtp: {
    host: process.env.SMTP_HOST || "127.0.0.1",
    port: intFromEnv("SMTP_PORT", 1025),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "no-reply@niffyinsure.local",
  },
  stellar: {
    rpcUrl: process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
    networkPassphrase:
      process.env.STELLAR_NETWORK_PASSPHRASE ||
      "Test SDF Network ; September 2015",
    contractId: process.env.CONTRACT_ID || "",
  },
};

export default config;
