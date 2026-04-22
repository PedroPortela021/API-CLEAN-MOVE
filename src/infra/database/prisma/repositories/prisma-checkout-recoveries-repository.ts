import { Injectable } from "@nestjs/common";
import { CheckoutRecoveriesRepository } from "../../../../modules/application/repositories/checkout-recoveries-repository";
import { CheckoutRecovery } from "../../../../modules/payment/domain/entities/checkout-recovery";
import { PrismaCheckoutRecoveryMapper } from "../mappers/prisma-checkout-recovery-mapper";
import { PrismaUnitOfWork } from "../prisma-unit-of-work";
import { rethrowPrismaRepositoryError } from "../prisma-repository-error-handler";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaCheckoutRecoveriesRepository implements CheckoutRecoveriesRepository {
  constructor(private prisma: PrismaService) {}

  async create(recovery: CheckoutRecovery): Promise<void> {
    const data = PrismaCheckoutRecoveryMapper.toPrisma(recovery);

    try {
      await PrismaUnitOfWork.getClient(this.prisma).checkoutRecovery.create({
        data,
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findById(id: string): Promise<CheckoutRecovery | null> {
    try {
      const recovery = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).checkoutRecovery.findUnique({
        where: {
          id,
        },
      });

      if (!recovery) {
        return null;
      }

      return PrismaCheckoutRecoveryMapper.toDomain(recovery);
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findManyPending(): Promise<CheckoutRecovery[]> {
    try {
      const recoveries = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).checkoutRecovery.findMany({
        where: {
          status: "PENDING",
        },
      });

      return recoveries.map((recovery) =>
        PrismaCheckoutRecoveryMapper.toDomain(recovery),
      );
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async save(recovery: CheckoutRecovery): Promise<void> {
    const data = PrismaCheckoutRecoveryMapper.toPrismaUpdate(recovery);

    try {
      await PrismaUnitOfWork.getClient(this.prisma).checkoutRecovery.update({
        where: {
          id: recovery.id.toString(),
        },
        data,
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }
}
