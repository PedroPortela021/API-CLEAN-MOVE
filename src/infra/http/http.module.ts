import { Module } from "@nestjs/common";

import { RegisterCustomerUseCase } from "../../modules/application/use-cases/customer/register-customer";
import { RegisterEstablishmentUseCase } from "../../modules/application/use-cases/establishment/register-establishment";
import { AuthModule } from "../auth/auth.module";
import { RegisterCustomerController } from "./controllers/register-customer.controller";
import { RegisterEstablishmentController } from "./controllers/register-establishment.controller";

@Module({
  imports: [AuthModule],
  controllers: [RegisterEstablishmentController, RegisterCustomerController],
  providers: [RegisterEstablishmentUseCase, RegisterCustomerUseCase],
})
export class HttpModule {}
