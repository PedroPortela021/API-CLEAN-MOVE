import { Module } from "@nestjs/common";
import { RegisterEstablishmentController } from "./controllers/register-establishment.controller";
import { RegisterEstablishmentUseCase } from "../../modules/application/use-cases/establishment/register-establishment";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [RegisterEstablishmentController],
  providers: [RegisterEstablishmentUseCase],
})
export class HttpModule {}
