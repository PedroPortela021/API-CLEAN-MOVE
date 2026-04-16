import { z } from "zod";

process.loadEnvFile();

export const nodeEnvSchema = z.enum(["development", "test", "production"]);

export const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number().optional().default(5432),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  DATABASE_URL: z.url(),
  NODE_ENV: nodeEnvSchema.default("development"),
  GOOGLE_CLIENT_ID: z.string().min(1).default("google-client-id"),
  JWT_ISSUER: z.string().min(1).default("api-clean-move"),
  JWT_ACCESS_TOKEN_SECRET: z
    .string()
    .min(32)
    .default("access-secret-access-secret-access"),
  JWT_REFRESH_TOKEN_SECRET: z
    .string()
    .min(32)
    .default("refresh-secret-refresh-secret-123"),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().min(1).default("15m"),
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().min(1).default("7d"),
});

export type NodeEnv = z.infer<typeof nodeEnvSchema>;
export type Env = z.infer<typeof envSchema>;
