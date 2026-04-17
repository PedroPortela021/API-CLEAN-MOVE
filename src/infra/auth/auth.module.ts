import { Module } from "@nestjs/common";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";

import { HashGenerator } from "../../modules/application/repositories/hash-generator";
import { HashComparer } from "../../modules/application/repositories/hash-comparer";
import { OAuthIdTokenVerifier } from "../../modules/application/services/oauth-id-token-verifier";
import { GoogleIdTokenVerifier } from "./google-id-token-verifier";
import { EnvModule } from "../env/env.module";
import { EnvService } from "../env/env.service";
import { BcryptHasher } from "./bcrypt-hasher";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    EnvModule,
    JwtModule.registerAsync({
      inject: [EnvService],
      useFactory: (envService: EnvService): JwtModuleOptions => ({
        secret: envService.get("JWT_ACCESS_SECRET"),
        signOptions: {
          algorithm: "HS256",
          expiresIn: envService.get("JWT_ACCESS_EXPIRES_IN"),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    BcryptHasher,
    { provide: HashGenerator, useExisting: BcryptHasher },
    { provide: HashComparer, useExisting: BcryptHasher },
    { provide: OAuthIdTokenVerifier, useClass: GoogleIdTokenVerifier },
  ],
  exports: [AuthService, HashGenerator, HashComparer, OAuthIdTokenVerifier],
})
export class AuthModule {}
