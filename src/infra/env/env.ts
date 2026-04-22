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
const nonEmptyStringSchema = z.string().trim().min(1);
const jwtExpiresInSchema = z.custom<StringValue>(
  (value) => typeof value === "string" && value.trim().length > 0,
  {
    message: "JWT_ACCESS_EXPIRES_IN must be a valid ms-style duration string.",
  },
);
const databaseUrlSchema = z.url().refine(
  (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
  {
    message: "DATABASE_URL must use a PostgreSQL URL (postgresql:// or postgres://).",
  },
);

export const envSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).optional().default(3000),
    FRONTEND_URL: z.url(),
    POSTGRES_HOST: nonEmptyStringSchema,
    POSTGRES_PORT: z.coerce.number().int().min(1).max(65535).optional().default(5432),
    POSTGRES_DB: nonEmptyStringSchema,
    POSTGRES_USER: nonEmptyStringSchema,
    POSTGRES_PASSWORD: nonEmptyStringSchema,
    DATABASE_URL: databaseUrlSchema,
    NODE_ENV: nodeEnvSchema.default("development"),
    GOOGLE_CLIENT_ID: nonEmptyStringSchema.default("google-client-id"),
    JWT_ACCESS_SECRET: nonEmptyStringSchema.min(32),
    JWT_REFRESH_SECRET: nonEmptyStringSchema.min(32),
    JWT_ACCESS_EXPIRES_IN: jwtExpiresInSchema.default("15m"),
    REFRESH_TOKEN_TTL_IN_MS: z.coerce.number().int().positive(),
  })
  .superRefine(({ NODE_ENV, FRONTEND_URL }, context) => {
    if (NODE_ENV !== "production") {
      return;
    }

    const isHttpsFrontend = FRONTEND_URL.startsWith("https://");

    if (!isHttpsFrontend) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["FRONTEND_URL"],
        message: "FRONTEND_URL must use https:// when NODE_ENV=production.",
      });
    }
  });

export type NodeEnv = z.infer<typeof nodeEnvSchema>;
export type Env = z.infer<typeof envSchema>;
