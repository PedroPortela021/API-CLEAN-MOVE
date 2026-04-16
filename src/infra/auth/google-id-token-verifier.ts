import { Injectable } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";
import { EnvService } from "../env/env.service";
import {
  OAuthIdTokenVerifier,
  OAuthUserClaims,
} from "../../modules/application/services/oauth-id-token-verifier";

@Injectable()
export class GoogleIdTokenVerifier implements OAuthIdTokenVerifier {
  private readonly client: OAuth2Client;
  private readonly audience: string;

  constructor(envService: EnvService) {
    this.audience = envService.get("GOOGLE_CLIENT_ID");
    this.client = new OAuth2Client(this.audience);
  }

  async verifyGoogleIdToken(idToken: string): Promise<OAuthUserClaims> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.audience,
      });
      const payload = ticket.getPayload();

      if (!payload) throw new Error("Invalid OAuth token.");

      const subjectId = payload.sub;
      const email = payload.email;
      if (!subjectId || typeof subjectId !== "string") {
        throw new Error("Invalid OAuth token subject.");
      }

      if (!email || typeof email !== "string") {
        throw new Error("Invalid OAuth token email.");
      }

      const claims: OAuthUserClaims = {
        provider: "GOOGLE",
        subjectId,
        email,
        emailVerified: payload.email_verified === true,
      };

      if (typeof payload.name === "string") {
        claims.name = payload.name;
      }

      return claims;
    } catch {
      throw new Error("Invalid OAuth token.");
    }
  }
}
