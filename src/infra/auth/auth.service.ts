import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { EnvService } from "../env/env.service";

export type AccessTokenPayload = {
  sub: string;
  role: string;
  sid: string;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  sid: string;
  jti: string;
  type: "refresh";
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
  ) {}

  async generateAccessToken(payload: {
    sub: string;
    role: string;
    sid: string;
  }) {
    return this.jwtService.signAsync({
      ...payload,
      type: "access",
    } satisfies AccessTokenPayload);
  }

  async generateRefreshToken(payload: { sub: string; sid: string }) {
    return this.jwtService.signAsync(
      {
        ...payload,
        jti: randomUUID(),
        type: "refresh",
      } satisfies RefreshTokenPayload,
      {
        secret: this.envService.get("JWT_REFRESH_SECRET"),
        expiresIn: Math.floor(
          this.envService.get("REFRESH_TOKEN_TTL_IN_MS") / 1000,
        ),
      },
    );
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);

    if (payload.type !== "access") {
      throw new Error("Invalid access token type.");
    }

    return payload;
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
      token,
      {
        secret: this.envService.get("JWT_REFRESH_SECRET"),
      },
    );

    if (payload.type !== "refresh") {
      throw new Error("Invalid refresh token type.");
    }

    return payload;
  }
}
