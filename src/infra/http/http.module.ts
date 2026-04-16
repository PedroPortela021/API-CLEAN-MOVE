import { Module } from "@nestjs/common";

import { RegisterCustomerUseCase } from "../../modules/application/use-cases/customer/register-customer";
import { RegisterEstablishmentUseCase } from "../../modules/application/use-cases/establishment/register-establishment";
import { AuthenticateWithOAuthUseCase } from "../../modules/application/use-cases/auth/authenticate-with-oauth";
import { AuthModule } from "../auth/auth.module";
import { AuthenticateWithGoogleController } from "./controllers/authenticate-with-google.controller";
import { RegisterCustomerController } from "./controllers/register-customer.controller";
import { RegisterEstablishmentController } from "./controllers/register-establishment.controller";

@Module({
  imports: [AuthModule],
  controllers: [
    RegisterEstablishmentController,
    RegisterCustomerController,
    AuthenticateWithGoogleController,
  ],
  providers: [
    RegisterEstablishmentUseCase,
    RegisterCustomerUseCase,
    AuthenticateWithOAuthUseCase,
  ],
})
export class HttpModule {}
