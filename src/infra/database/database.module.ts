import { Global, Module } from "@nestjs/common";

import { EnvModule } from "../env/env.module";
import { PrismaService } from "./prisma/prisma.service";
import { EstablishmentsRepository } from "../../modules/application/repositories/establishment-repository";
import { PrismaEstablishmentRepository } from "./prisma/repositories/prisma-establishments-repository";
import { UsersRepository } from "../../modules/application/repositories/users-repository";
import { PrismaUsersRepository } from "./prisma/repositories/prisma-users-repository";
import { UnitOfWork } from "../../modules/application/repositories/unit-of-work";
import { PrismaUnitOfWork } from "./prisma/prisma-unit-of-work";

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
  ],
  exports: [PrismaService, UnitOfWork, EstablishmentsRepository, UsersRepository],
})
export class DatabaseModule {}
