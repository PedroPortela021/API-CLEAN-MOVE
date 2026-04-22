import { Global, Module } from "@nestjs/common";

import { CustomersRepository } from "../../modules/application/repositories/customers-repository";
import { FavoritesRepository } from "../../modules/application/repositories/favorites-repository";
import { EstablishmentsRepository } from "../../modules/application/repositories/establishment-repository";
import { PaymentsRepository } from "../../modules/application/repositories/payments-repository";
import { CheckoutRecoveriesRepository } from "../../modules/application/repositories/checkout-recoveries-repository";
import { UnitOfWork } from "../../modules/application/repositories/unit-of-work";
import { UsersRepository } from "../../modules/application/repositories/users-repository";
import { EnvModule } from "../env/env.module";
import { PrismaService } from "./prisma/prisma.service";
import { PrismaCheckoutRecoveriesRepository } from "./prisma/repositories/prisma-checkout-recoveries-repository";
import { PrismaEstablishmentRepository } from "./prisma/repositories/prisma-establishments-repository";
import { PrismaFavoritesRepository } from "./prisma/repositories/prisma-favorites-repository";
import { PrismaCustomersRepository } from "./prisma/repositories/prisma-customers-repository";
import { PrismaPaymentsRepository } from "./prisma/repositories/prisma-payments-repository";
import { PrismaUsersRepository } from "./prisma/repositories/prisma-users-repository";
import { PrismaUnitOfWork } from "./prisma/prisma-unit-of-work";
import { SessionsRepository } from "../../modules/application/repositories/sessions-repository";
import { PrismaSessionsRepository } from "./prisma/repositories/prisma-sessions-repository";

@Global()
@Module({
  imports: [EnvModule],
  providers: [
    PrismaService,
    {
      provide: UnitOfWork,
      useClass: PrismaUnitOfWork,
    },
    {
      provide: EstablishmentsRepository,
      useClass: PrismaEstablishmentRepository,
    },
    {
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },
    {
      provide: CustomersRepository,
      useClass: PrismaCustomersRepository,
    },
    {
      provide: SessionsRepository,
      useClass: PrismaSessionsRepository,
    },
    {
      provide: FavoritesRepository,
      useClass: PrismaFavoritesRepository,
    },
    {
      provide: PaymentsRepository,
      useClass: PrismaPaymentsRepository,
    },
    {
      provide: CheckoutRecoveriesRepository,
      useClass: PrismaCheckoutRecoveriesRepository,
    },
  ],
  exports: [
    PrismaService,
    UnitOfWork,
    EstablishmentsRepository,
    UsersRepository,
    SessionsRepository,
    CustomersRepository,
    FavoritesRepository,
    PaymentsRepository,
    CheckoutRecoveriesRepository,
  ],
})
export class DatabaseModule {}
