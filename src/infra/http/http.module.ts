import { Module } from "@nestjs/common";
import { RegisterEstablishmentUseCase } from "../../modules/application/use-cases/establishment/register-establishment";
import { AuthenticateWithOAuthUseCase } from "../../modules/application/use-cases/auth/authenticate-with-oauth";
import { AuthModule } from "../auth/auth.module";
import { AuthenticateWithGoogleController } from "./controllers/authenticate-with-google.controller";
import { RegisterCustomerController } from "./controllers/register-customer.controller";
import { SessionCreationService } from "../../modules/accounts/domain/services/session-creation-service";
import { LoginWithCredentialsController } from "./controllers/login-with-credentials.controller";
import { RegisterEstablishmentController } from "./controllers/register-establishment.controller";
import { DatabaseModule } from "../database/database.module";
import { LoginWithCredentialsUseCase } from "../../modules/application/use-cases/auth/login-with-credentials";
import { RegisterCustomerUseCase } from "../../modules/application/use-cases/customer/register-customer";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [
    RegisterEstablishmentController,
    RegisterCustomerController,
    AuthenticateWithGoogleController,
    LoginWithCredentialsController,
  ],
  providers: [
    RegisterEstablishmentUseCase,
    AuthenticateWithOAuthUseCase,
    LoginWithCredentialsUseCase,
    RegisterCustomerUseCase,
    SessionCreationService,
  ],
})
export class HttpModule {}
