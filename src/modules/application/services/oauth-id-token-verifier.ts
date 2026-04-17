import { Injectable } from "@nestjs/common";
import type { OAuthProvider } from "../../accounts/domain/value-objects/oauth-provider";

export type OAuthUserClaims = {
  provider: OAuthProvider;
  subjectId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
};

@Injectable()
export abstract class OAuthIdTokenVerifier {
  abstract verifyGoogleIdToken(idToken: string): Promise<OAuthUserClaims>;
}
