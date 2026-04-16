import { Module } from "@nestjs/common";
import { HashGenerator } from "../../modules/application/repositories/hash-generator";
import { BcryptHasher } from "./bcrypt-hasher";
import { HashComparer } from "../../modules/application/repositories/hash-comparer";
import { OAuthIdTokenVerifier } from "../../modules/application/services/oauth-id-token-verifier";
import { GoogleIdTokenVerifier } from "./google-id-token-verifier";
import { AuthTokenService } from "../../modules/application/services/auth-token-service";
import { JwtTokenService } from "./jwt-token.service";

@Module({
  providers: [
    BcryptHasher,
    { provide: HashGenerator, useExisting: BcryptHasher },
    { provide: HashComparer, useExisting: BcryptHasher },
    { provide: OAuthIdTokenVerifier, useClass: GoogleIdTokenVerifier },
    { provide: AuthTokenService, useClass: JwtTokenService },
  ],
  exports: [HashGenerator, HashComparer, OAuthIdTokenVerifier, AuthTokenService],
})
export class AuthModule {}
