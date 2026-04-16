import { Module } from "@nestjs/common";
import { RegisterEstablishmentController } from "./controllers/register-establishment.controller";
import { RegisterEstablishmentUseCase } from "../../modules/application/use-cases/establishment/register-establishment";
import { AuthModule } from "../auth/auth.module";
import { LoginWithCredentialsController } from "./controllers/login-with-credentials.controller";
import { LoginWithCredentialsUseCase } from "../../modules/application/use-cases/auth/login-with-credentials";
import { DatabaseModule } from "../database/database.module";
import { SessionCreationService } from "../../modules/accounts/domain/services/session-creation-service";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [
    RegisterEstablishmentController,
    LoginWithCredentialsController,
  ],
  providers: [
    RegisterEstablishmentUseCase,
    LoginWithCredentialsUseCase,
    SessionCreationService,
  ],
})
export class HttpModule {}
