import { z } from "zod";
import type { StringValue } from "ms";

try {
  process.loadEnvFile();
} catch (error) {
  // CI and containerized environments may inject vars without a local .env file.
  const isMissingEnvFile =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT";

  if (!isMissingEnvFile) {
    throw error;
  }
}

export const nodeEnvSchema = z.enum(["development", "test", "production"]);
const jwtExpiresInSchema = z.custom<StringValue>(
  (value) => typeof value === "string" && value.trim().length > 0,
  {
    message: "JWT_ACCESS_EXPIRES_IN must be a valid ms-style duration string.",
  },
);

export const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  FRONTEND_URL: z.url(),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number().optional().default(5432),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  DATABASE_URL: z.url(),
  NODE_ENV: nodeEnvSchema.default("development"),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: jwtExpiresInSchema.default("15m"),
  REFRESH_TOKEN_TTL_IN_MS: z.coerce.number().int().positive(),
});

export type NodeEnv = z.infer<typeof nodeEnvSchema>;
export type Env = z.infer<typeof envSchema>;
