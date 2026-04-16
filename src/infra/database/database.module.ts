import { Global, Module } from "@nestjs/common";

import { CustomersRepository } from "../../modules/application/repositories/customers-repository";
import { EstablishmentsRepository } from "../../modules/application/repositories/establishment-repository";
import { UnitOfWork } from "../../modules/application/repositories/unit-of-work";
import { UsersRepository } from "../../modules/application/repositories/users-repository";
import { EnvModule } from "../env/env.module";
import { PrismaService } from "./prisma/prisma.service";
import { PrismaEstablishmentRepository } from "./prisma/repositories/prisma-establishments-repository";
import { PrismaCustomersRepository } from "./prisma/repositories/prisma-customers-repository";
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
  ],
  exports: [
    PrismaService,
    UnitOfWork,
    EstablishmentsRepository,
    UsersRepository,
    SessionsRepository,
    CustomersRepository,
  ],
})
export class DatabaseModule {}
