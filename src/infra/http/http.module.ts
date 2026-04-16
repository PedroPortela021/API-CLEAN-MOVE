import { Module } from "@nestjs/common";

import { RegisterCustomerUseCase } from "../../modules/application/use-cases/customer/register-customer";
import { RegisterCustomerController } from "./controllers/register-customer.controller";
import { RegisterEstablishmentUseCase } from "../../modules/application/use-cases/establishment/register-establishment";
import { RegisterEstablishmentController } from "./controllers/register-establishment.controller";
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

@Module({
  imports: [AuthModule],
  controllers: [RegisterEstablishmentController, RegisterCustomerController],
  providers: [RegisterEstablishmentUseCase, RegisterCustomerUseCase],
})
export class HttpModule {}
