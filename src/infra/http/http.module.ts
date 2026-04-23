import { Module } from "@nestjs/common";
import { AppointmentBookingService } from "../../modules/application/services/appointment-booking-service";
import { AuthenticateWithOAuthUseCase } from "../../modules/application/use-cases/auth/authenticate-with-oauth";
import { BookServiceUseCase } from "../../modules/application/use-cases/appointment/book-service";
import { LoginWithCredentialsUseCase } from "../../modules/application/use-cases/auth/login-with-credentials";
import { RequestPasswordResetUseCase } from "../../modules/application/use-cases/auth/request-password-reset";
import { RefreshSessionUseCase } from "../../modules/application/use-cases/auth/refresh-session";
import { ResetPasswordWithCodeUseCase } from "../../modules/application/use-cases/auth/reset-password-with-code";
import { SignOutUseCase } from "../../modules/application/use-cases/auth/sign-out";
import { MailSender } from "../../modules/application/gateways/mail-sender";
import { ResetCodeGenerator } from "../../modules/application/repositories/reset-code-generator";
import { RegisterCustomerUseCase } from "../../modules/application/use-cases/customer/register-customer";
import { RegisterEstablishmentUseCase } from "../../modules/application/use-cases/establishment/register-establishment";
import { SessionCreationService } from "../../modules/accounts/domain/services/session-creation-service";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { AuthenticateWithGoogleController } from "./controllers/authenticate-with-google.controller";
import { BookServiceController } from "./controllers/book-service.controller";
import { LoginWithCredentialsController } from "./controllers/login-with-credentials.controller";
import { RequestPasswordResetController } from "./controllers/request-password-reset.controller";
import { ResetPasswordController } from "./controllers/reset-password.controller";
import { SignOutController } from "./controllers/sign-out.controller";
import { RegisterCustomerController } from "./controllers/register-customer.controller";
import { RefreshSessionController } from "./controllers/refresh-session.controller";
import { RegisterEstablishmentController } from "./controllers/register-establishment.controller";
import { RandomResetTokenGenerator } from "../mail/random-reset-token-generator";
import { ResendMailSender } from "../mail/resend-mail-sender";

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
    RequestPasswordResetController,
    ResetPasswordController,
  ],
  providers: [
    RegisterEstablishmentUseCase,
    AuthenticateWithOAuthUseCase,
    BookServiceUseCase,
    LoginWithCredentialsUseCase,
    RefreshSessionUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordWithCodeUseCase,
    SignOutUseCase,
    RegisterCustomerUseCase,
    SessionCreationService,
    AppointmentBookingService,
    ResendMailSender,
    RandomResetTokenGenerator,
    { provide: MailSender, useExisting: ResendMailSender },
    { provide: ResetCodeGenerator, useExisting: RandomResetTokenGenerator },
  ],
})
export class HttpModule {}
