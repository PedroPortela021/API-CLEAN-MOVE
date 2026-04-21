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
  extractRefreshTokenCookie,
  getHttpServer,
  loginUser,
  makeRefreshTokenCookieHeader,
} from "../../../../tests/helpers/auth-session.e2e-helpers";

describe("SignOutController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let hashGenerator: HashGenerator;
  let envService: EnvService;
  let userFactory: UserFactory;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it("should reject sign-out requests without an access token", async () => {
    const response = await request(getHttpServer(app)).post("/auth/sign-out");

    expect(response.status).toBe(401);
  });

  it("should reject sign-out requests with only a refresh token cookie", async () => {
    const { user, plainPassword } = await userFactory.makePrismaUser({
      role: "CUSTOMER",
      plainPassword: "strong-password",
    });
    const { refreshToken } = await loginUser({
      app,
      prisma,
      userId: user.id.toString(),
      email: user.email.toString(),
      password: plainPassword ?? "",
    });

    const response = await request(getHttpServer(app))
      .post("/auth/sign-out")
      .set("Cookie", makeRefreshTokenCookieHeader(refreshToken));

    expect(response.status).toBe(401);
  });

  it("should reject sign-out requests with an expired access token", async () => {
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
    const expiredAccessToken = await new JwtService({
      secret: envService.get("JWT_ACCESS_SECRET"),
    }).signAsync(
      {
        sub: user.id.toString(),
        role: user.role,
        sid: sessionId,
        type: "access",
      },
      {
        expiresIn: "-1s",
      },
    );

    const response = await request(getHttpServer(app))
      .post("/auth/sign-out")
      .set("Authorization", `Bearer ${expiredAccessToken}`)
      .set("Cookie", makeRefreshTokenCookieHeader(refreshToken));

    expect(response.status).toBe(401);
  });

  it("should reject sign-out requests when the access token sub does not match the session owner", async () => {
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
    const forgedAccessToken = await new JwtService({
      secret: envService.get("JWT_ACCESS_SECRET"),
    }).signAsync({
      sub: secondUser.user.id.toString(),
      role: secondUser.user.role,
      sid: sessionId,
      type: "access",
    });

    const response = await request(getHttpServer(app))
      .post("/auth/sign-out")
      .set("Authorization", `Bearer ${forgedAccessToken}`);

    expect(response.status).toBe(401);
  });

  it("should revoke the current session, clear the refresh token cookie and invalidate the access token", async () => {
    const { user, plainPassword } = await userFactory.makePrismaUser({
      role: "CUSTOMER",
      plainPassword: "strong-password",
    });
    const { loginBody, refreshToken } = await loginUser({
      app,
      prisma,
      userId: user.id.toString(),
      email: user.email.toString(),
      password: plainPassword ?? "",
    });

    const signOutResponse = await request(getHttpServer(app))
      .post("/auth/sign-out")
      .set("Authorization", `Bearer ${loginBody.accessToken}`)
      .set("Cookie", makeRefreshTokenCookieHeader(refreshToken));
    const signOutSetCookie = z
      .array(z.string())
      .parse(signOutResponse.headers["set-cookie"]);
    const clearedRefreshTokenCookie =
      extractRefreshTokenCookie(signOutSetCookie);

    expect(signOutResponse.status).toBe(204);
    expect(clearedRefreshTokenCookie).toContain("HttpOnly");
    expect(clearedRefreshTokenCookie).toContain("Path=/auth");
    expect(clearedRefreshTokenCookie).toContain("Max-Age=0");

    const revokedSession = await prisma.session.findFirst({
      where: {
        userId: user.id.toString(),
      },
    });

    expect(revokedSession?.revokedAt).not.toBeNull();

    const repeatedSignOut = await request(getHttpServer(app))
      .post("/auth/sign-out")
      .set("Authorization", `Bearer ${loginBody.accessToken}`);

    expect(repeatedSignOut.status).toBe(401);

    const refreshAfterSignOut = await request(getHttpServer(app))
      .post("/auth/refresh")
      .set("Cookie", makeRefreshTokenCookieHeader(refreshToken));

    expect(refreshAfterSignOut.status).toBe(401);
  });
});
