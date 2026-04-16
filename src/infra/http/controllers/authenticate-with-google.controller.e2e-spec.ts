import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import z from "zod";
import { AppModule } from "../../app.module";
import { Prisma } from "../../../generated/prisma/client";
import { PrismaService } from "../../database/prisma/prisma.service";
import { GoogleIdTokenVerifier } from "../../auth/google-id-token-verifier";

const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: z.object({
    id: z.uuid(),
    role: z.enum(["CUSTOMER", "ESTABLISHMENT", "ADMIN"]),
    profileComplete: z.boolean(),
  }),
});

const singleMessageResponseSchema = z.object({
  message: z.string(),
});

const ACCESS_SECRET = "access-secret-access-secret-access";

function getHttpServer(app: INestApplication): Parameters<typeof request>[0] {
  return app.getHttpServer() as Parameters<typeof request>[0];
}

describe("AuthenticateWithGoogleController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    vi.spyOn(
      GoogleIdTokenVerifier.prototype,
      "verifyGoogleIdToken",
    ).mockImplementation(async (idToken: string) => {
      if (idToken === "invalid-token") {
        throw new Error("Invalid OAuth token.");
      }

      if (idToken === "unverified-email-token") {
        return {
          provider: "GOOGLE",
          subjectId: "google-sub-unverified",
          email: "unverified@example.com",
          emailVerified: false,
          name: "OAuth Unverified",
        };
      }

      if (idToken === "linked-account-token") {
        return {
          provider: "GOOGLE",
          subjectId: "google-sub-linked",
          email: "linked@example.com",
          emailVerified: true,
          name: "Linked User",
        };
      }

      if (idToken === "link-by-email-token") {
        return {
          provider: "GOOGLE",
          subjectId: "google-sub-by-email",
          email: "email-match@example.com",
          emailVerified: true,
          name: "Email Match",
        };
      }

      if (idToken === "new-user-token") {
        return {
          provider: "GOOGLE",
          subjectId: "google-sub-new",
          email: "new-user@example.com",
          emailVerified: true,
          name: "New OAuth User",
        };
      }

      throw new Error("Invalid OAuth token.");
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  it("should authenticate an already linked user", async () => {
    const linkedUser = await prisma.user.create({
      data: {
        name: "Linked User",
        email: "linked@example.com",
        hashedPassword: null,
        role: "CUSTOMER",
        phone: null,
        address: Prisma.JsonNull,
        socialAccounts: {
          create: {
            provider: "GOOGLE",
            subjectId: "google-sub-linked",
          },
        },
      },
    });

    const response = await request(getHttpServer(app))
      .post("/auth/oauth/google")
      .send({ idToken: "linked-account-token" });

    expect(response.status).toBe(201);

    const responseBody = authResponseSchema.parse(response.body);
    expect(responseBody.user.id).toBe(linkedUser.id);

    const verifiedToken = jwt.verify(responseBody.accessToken, ACCESS_SECRET, {
      issuer: "api-clean-move",
    });

    expect(typeof verifiedToken).toBe("object");
    if (typeof verifiedToken === "string") {
      throw new Error("Invalid token payload type.");
    }
    expect(verifiedToken.sub).toBe(linkedUser.id);
  });

  it("should link social account when email already exists", async () => {
    const existingUser = await prisma.user.create({
      data: {
        name: "Email Match",
        email: "email-match@example.com",
        hashedPassword: null,
        role: "CUSTOMER",
        phone: null,
        address: Prisma.JsonNull,
      },
    });

    const response = await request(getHttpServer(app))
      .post("/auth/oauth/google")
      .send({ idToken: "link-by-email-token" });

    expect(response.status).toBe(201);

    const responseBody = authResponseSchema.parse(response.body);
    expect(responseBody.user.id).toBe(existingUser.id);

    const linkedAccount = await prisma.socialAccount.findUnique({
      where: {
        provider_subjectId: {
          provider: "GOOGLE",
          subjectId: "google-sub-by-email",
        },
      },
    });

    expect(linkedAccount).not.toBeNull();
    expect(linkedAccount?.userId).toBe(existingUser.id);
  });

  it("should create a new incomplete user when account does not exist", async () => {
    const response = await request(getHttpServer(app))
      .post("/auth/oauth/google")
      .send({ idToken: "new-user-token" });

    expect(response.status).toBe(201);

    const responseBody = authResponseSchema.parse(response.body);

    const createdUser = await prisma.user.findUnique({
      where: {
        id: responseBody.user.id,
      },
      include: {
        socialAccounts: true,
      },
    });

    expect(createdUser).not.toBeNull();
    expect(createdUser?.hashedPassword).toBeNull();
    expect(createdUser?.phone).toBeNull();
    expect(createdUser?.address).toBeNull();
    expect(createdUser?.socialAccounts).toEqual([
      expect.objectContaining({
        provider: "GOOGLE",
        subjectId: "google-sub-new",
      }),
    ]);
  });

  it("should return 400 when OAuth email is not verified", async () => {
    const response = await request(getHttpServer(app))
      .post("/auth/oauth/google")
      .send({ idToken: "unverified-email-token" });

    expect(response.status).toBe(400);

    const responseBody = singleMessageResponseSchema.parse(response.body);
    expect(responseBody.message).toBe("OAuth email is not verified.");
  });

  it("should return 401 when OAuth token is invalid", async () => {
    const response = await request(getHttpServer(app))
      .post("/auth/oauth/google")
      .send({ idToken: "invalid-token" });

    expect(response.status).toBe(401);

    const responseBody = singleMessageResponseSchema.parse(response.body);
    expect(responseBody.message).toBe("Invalid OAuth token.");
  });
});
