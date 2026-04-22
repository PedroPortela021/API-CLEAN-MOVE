import { Module } from "@nestjs/common";
import { AppointmentBookingService } from "../../modules/application/services/appointment-booking-service";
import { AuthenticateWithOAuthUseCase } from "../../modules/application/use-cases/auth/authenticate-with-oauth";
import { BookServiceUseCase } from "../../modules/application/use-cases/appointment/book-service";
import { LoginWithCredentialsUseCase } from "../../modules/application/use-cases/auth/login-with-credentials";
import { RefreshSessionUseCase } from "../../modules/application/use-cases/auth/refresh-session";
import { SignOutUseCase } from "../../modules/application/use-cases/auth/sign-out";
import { RegisterCustomerUseCase } from "../../modules/application/use-cases/customer/register-customer";
import { RegisterEstablishmentUseCase } from "../../modules/application/use-cases/establishment/register-establishment";
import { SessionCreationService } from "../../modules/accounts/domain/services/session-creation-service";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { AuthenticateWithGoogleController } from "./controllers/authenticate-with-google.controller";
import { BookServiceController } from "./controllers/book-service.controller";
import { LoginWithCredentialsController } from "./controllers/login-with-credentials.controller";
import { SignOutController } from "./controllers/sign-out.controller";
import { RegisterCustomerController } from "./controllers/register-customer.controller";
import { RefreshSessionController } from "./controllers/refresh-session.controller";
import { RegisterEstablishmentController } from "./controllers/register-establishment.controller";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [
    RegisterEstablishmentController,
    RegisterCustomerController,
    AuthenticateWithGoogleController,
    LoginWithCredentialsController,
    RefreshSessionController,
    SignOutController,
    BookServiceController,
  ],
  providers: [
    RegisterEstablishmentUseCase,
    AuthenticateWithOAuthUseCase,
    BookServiceUseCase,
    LoginWithCredentialsUseCase,
    RefreshSessionUseCase,
    SignOutUseCase,
    RegisterCustomerUseCase,
    SessionCreationService,
    AppointmentBookingService,
  ],
})
export class HttpModule {}
