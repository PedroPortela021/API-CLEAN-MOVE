import { AsyncLocalStorage } from "node:async_hooks";
import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../generated/prisma/client";
import { UnitOfWork } from "../../../modules/application/repositories/unit-of-work";
import { PrismaService } from "./prisma.service";

type PrismaExecutionClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class PrismaUnitOfWork extends UnitOfWork {
  private static transactionStorage =
    new AsyncLocalStorage<Prisma.TransactionClient>();

  constructor(private prisma: PrismaService) {
    super();
  }

  static getClient(prisma: PrismaService): PrismaExecutionClient {
    return this.transactionStorage.getStore() ?? prisma;
  }

  protected async perform<T>(work: () => Promise<T>): Promise<T> {
    const currentTransaction = PrismaUnitOfWork.transactionStorage.getStore();

    if (currentTransaction) {
      return work();
    }

    return this.prisma.$transaction((transaction) => {
      return PrismaUnitOfWork.transactionStorage.run(transaction, work);
    });
  }
}
