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
});

export type NodeEnv = z.infer<typeof nodeEnvSchema>;
export type Env = z.infer<typeof envSchema>;
