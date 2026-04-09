import { z } from "zod";

process.loadEnvFile();

export const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number().optional().default(5432),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  DATABASE_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;
