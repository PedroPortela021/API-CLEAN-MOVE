import { execFileSync } from "node:child_process";

import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";

import { PrismaClient } from "../../src/generated/prisma/client";
import { configureE2EEnv } from "./env";

let prisma: PrismaClient | null = null;

function escapeIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function getTestDatabaseUrl(): string {
  return configureE2EEnv().databaseUrl;
}

function getAdminDatabaseUrl(): string {
  const url = new URL(getTestDatabaseUrl());

  url.pathname = "/postgres";

  return url.toString();
}

function getTestDatabaseName(): string {
  const url = new URL(getTestDatabaseUrl());
  const databaseName = url.pathname.slice(1);

  if (!databaseName) {
    throw new Error("DATABASE_URL must include a database name.");
  }

  return databaseName;
}

function getPrismaClient(): PrismaClient {
  if (prisma) {
    return prisma;
  }

  const adapter = new PrismaPg({
    connectionString: getTestDatabaseUrl(),
  });

  prisma = new PrismaClient({
    adapter,
    log: ["warn", "error"],
  });

  return prisma;
}

export async function ensureTestDatabaseExists(): Promise<void> {
  const client = new Client({
    connectionString: getAdminDatabaseUrl(),
  });

  await client.connect();

  try {
    const databaseName = getTestDatabaseName();
    const databaseAlreadyExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName],
    );

    if (databaseAlreadyExists.rowCount === 0) {
      await client.query(
        `CREATE DATABASE ${escapeIdentifier(getTestDatabaseName())}`,
      );
    }
  } finally {
    await client.end();
  }
}

export async function resetTestDatabase(): Promise<void> {
  await ensureTestDatabaseExists();

  execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["prisma", "migrate", "reset", "--force"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: getTestDatabaseUrl(),
        NODE_ENV: "test",
      },
      stdio: "inherit",
    },
  );
}

export async function truncateAllTables(): Promise<void> {
  const prismaClient = getPrismaClient();

  const tables = await prismaClient.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) {
    return;
  }

  const tableNames = tables
    .map(({ tablename }) => `"public".${escapeIdentifier(tablename)}`)
    .join(", ");

  await prismaClient.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`,
  );
}

export async function disconnectTestDatabase(): Promise<void> {
  if (!prisma) {
    return;
  }

  await prisma.$disconnect();
  prisma = null;
}
