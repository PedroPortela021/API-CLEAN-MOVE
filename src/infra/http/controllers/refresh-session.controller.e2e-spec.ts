import { randomUUID } from "node:crypto";
import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import z from "zod";

import { UserFactory } from "../../../../tests/factories/user-factory";
import { HashGenerator } from "../../../modules/application/repositories/hash-generator";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../database/prisma/prisma.service";
import { EnvService } from "../../env/env.service";
import {
  authResponseSchema,
  extractRefreshTokenCookie,
  extractRefreshTokenValue,
  getHttpServer,
  loginUser,
  makeRefreshTokenCookieHeader,
} from "../../../../tests/helpers/auth-session.e2e-helpers";

describe("RefreshSessionController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let hashGenerator: HashGenerator;
  let envService: EnvService;
  let userFactory: UserFactory;
  let refreshJwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = moduleRef.get(PrismaService);
    hashGenerator = moduleRef.get(HashGenerator);
    envService = moduleRef.get(EnvService);
    userFactory = new UserFactory(prisma, hashGenerator);
    refreshJwtService = new JwtService({
      secret: envService.get("JWT_REFRESH_SECRET"),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("should reject refresh requests without a refresh token cookie", async () => {
    const response = await request(getHttpServer(app)).post("/auth/refresh");

    expect(response.status).toBe(401);
  });

  it("should reject refresh requests with an invalid refresh token", async () => {
    const response = await request(getHttpServer(app))
      .post("/auth/refresh")
      .set("Cookie", makeRefreshTokenCookieHeader("invalid-refresh-token"));

    expect(response.status).toBe(401);
  });

  it("should reject refresh requests with an expired refresh token", async () => {
    const { user, plainPassword } = await userFactory.makePrismaUser({
      role: "CUSTOMER",
      plainPassword: "strong-password",
    });
    const { sessionId } = await loginUser({
      app,
      prisma,
      userId: user.id.toString(),
      email: user.email.toString(),
      password: plainPassword ?? "",
    });
    const expiredRefreshToken = await refreshJwtService.signAsync(
      {
        sub: user.id.toString(),
        sid: sessionId,
        jti: randomUUID(),
        type: "refresh",
      },
      {
        expiresIn: "-1s",
      },
    );

    const response = await request(getHttpServer(app))
      .post("/auth/refresh")
      .set("Cookie", makeRefreshTokenCookieHeader(expiredRefreshToken));

    expect(response.status).toBe(401);
  });

  it("should reject refresh requests when the refresh token sub does not match the session owner", async () => {
    const firstLogin = await userFactory.makePrismaUser({
      role: "CUSTOMER",
      plainPassword: "strong-password",
    });
    const secondUser = await userFactory.makePrismaUser({
      role: "CUSTOMER",
      plainPassword: "strong-password",
    });
    const { sessionId } = await loginUser({
      app,
      prisma,
      userId: firstLogin.user.id.toString(),
      email: firstLogin.user.email.toString(),
      password: firstLogin.plainPassword ?? "",
    });
    const forgedRefreshToken = await refreshJwtService.signAsync({
      sub: secondUser.user.id.toString(),
      sid: sessionId,
      jti: randomUUID(),
      type: "refresh",
    });

    const response = await request(getHttpServer(app))
      .post("/auth/refresh")
      .set("Cookie", makeRefreshTokenCookieHeader(forgedRefreshToken));

    expect(response.status).toBe(401);
  });

  it("should reject refresh requests for a revoked session", async () => {
    const { user, plainPassword } = await userFactory.makePrismaUser({
      role: "CUSTOMER",
      plainPassword: "strong-password",
    });
    const { refreshToken, sessionId } = await loginUser({
      app,
      prisma,
      userId: user.id.toString(),
      email: user.email.toString(),
      password: plainPassword ?? "",
    });

    await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    const response = await request(getHttpServer(app))
      .post("/auth/refresh")
      .set("Cookie", makeRefreshTokenCookieHeader(refreshToken));

    expect(response.status).toBe(401);
  });

  it("should refresh the session, rotate the refresh token and reject a reused refresh token", async () => {
    const { user, plainPassword } = await userFactory.makePrismaUser({
      role: "CUSTOMER",
      plainPassword: "strong-password",
    });
    const { refreshToken: oldRefreshToken } = await loginUser({
      app,
      prisma,
      userId: user.id.toString(),
      email: user.email.toString(),
      password: plainPassword ?? "",
    });

    const refreshResponse = await request(getHttpServer(app))
      .post("/auth/refresh")
      .set("Cookie", makeRefreshTokenCookieHeader(oldRefreshToken));
    const refreshBody = authResponseSchema.parse(refreshResponse.body);
    const refreshSetCookie = z
      .array(z.string())
      .parse(refreshResponse.headers["set-cookie"]);
    const newRefreshTokenCookie = extractRefreshTokenCookie(refreshSetCookie);
    const newRefreshToken = extractRefreshTokenValue(newRefreshTokenCookie);

    expect(refreshResponse.status).toBe(200);
    expect(refreshBody.userId).toBe(user.id.toString());
    expect(refreshBody.accessToken).toEqual(expect.any(String));
    expect(newRefreshToken).not.toBe(oldRefreshToken);

    const rotatedSession = await prisma.session.findFirst({
      where: {
        userId: user.id.toString(),
      },
    });

    expect(rotatedSession?.revokedAt).toBeNull();
    expect(rotatedSession?.lastUsedAt).not.toBeNull();
    expect(rotatedSession?.updatedAt.getTime()).toBeGreaterThan(
      rotatedSession?.createdAt.getTime() ?? 0,
    );

    const staleRefreshAttempt = await request(getHttpServer(app))
      .post("/auth/refresh")
      .set("Cookie", makeRefreshTokenCookieHeader(oldRefreshToken));

    expect(staleRefreshAttempt.status).toBe(401);

    const rotatedRefreshAttempt = await request(getHttpServer(app))
      .post("/auth/refresh")
      .set("Cookie", makeRefreshTokenCookieHeader(newRefreshToken));

    expect(rotatedRefreshAttempt.status).toBe(200);
  });
});
