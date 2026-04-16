import { Injectable } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { User } from "../../modules/accounts/domain/entities/user";
import {
  AuthTokenPair,
  AuthTokenService,
} from "../../modules/application/services/auth-token-service";
import { EnvService } from "../env/env.service";

@Injectable()
export class JwtTokenService implements AuthTokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly issuer: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(envService: EnvService) {
    this.accessSecret = envService.get("JWT_ACCESS_TOKEN_SECRET");
    this.refreshSecret = envService.get("JWT_REFRESH_TOKEN_SECRET");
    this.issuer = envService.get("JWT_ISSUER");
    this.accessExpiresIn = envService.get("JWT_ACCESS_TOKEN_EXPIRES_IN");
    this.refreshExpiresIn = envService.get("JWT_REFRESH_TOKEN_EXPIRES_IN");
  }

  async issueForUser(user: User): Promise<AuthTokenPair> {
    const subject = user.id.toString();
    const accessToken = jwt.sign(
      {
        role: user.role,
        profileComplete: user.isProfileComplete(),
      },
      this.accessSecret,
      {
        algorithm: "HS256",
        subject,
        issuer: this.issuer,
        expiresIn: this.accessExpiresIn as never,
      },
    );

    const refreshToken = jwt.sign(
      {
        tokenType: "refresh",
      },
      this.refreshSecret,
      {
        algorithm: "HS256",
        subject,
        issuer: this.issuer,
        expiresIn: this.refreshExpiresIn as never,
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
