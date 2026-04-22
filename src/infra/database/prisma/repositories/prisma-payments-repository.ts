import { Injectable } from "@nestjs/common";
import { PaymentsRepository } from "../../../../modules/application/repositories/payments-repository";
import { Payment } from "../../../../modules/payment/domain/entities/payment";
import { PrismaPaymentMapper } from "../mappers/prisma-payment-mapper";
import { PrismaUnitOfWork } from "../prisma-unit-of-work";
import { rethrowPrismaRepositoryError } from "../prisma-repository-error-handler";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaPaymentsRepository implements PaymentsRepository {
  constructor(private prisma: PrismaService) {}

  async create(payment: Payment): Promise<void> {
    const data = PrismaPaymentMapper.toPrisma(payment);

    try {
      await PrismaUnitOfWork.getClient(this.prisma).payment.create({
        data,
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findById(id: string): Promise<Payment | null> {
    try {
      const payment = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).payment.findUnique({
        where: {
          id,
        },
      });

      if (!payment) {
        return null;
      }

      return PrismaPaymentMapper.toDomain(payment);
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findByProviderNameAndPaymentId(
    providerName: string,
    providerPaymentId: string,
  ): Promise<Payment | null> {
    try {
      const payment = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).payment.findUnique({
        where: {
          providerName_providerPaymentId: {
            providerName,
            providerPaymentId,
          },
        },
      });

      if (!payment) {
        return null;
      }

      return PrismaPaymentMapper.toDomain(payment);
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findManyByAppointmentId(appointmentId: string): Promise<Payment[]> {
    try {
      const payments = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).payment.findMany({
        where: {
          appointmentId,
        },
      });

      return payments.map((payment) => PrismaPaymentMapper.toDomain(payment));
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findManyPending(): Promise<Payment[]> {
    try {
      const payments = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).payment.findMany({
        where: {
          status: "PENDING",
        },
      });

      return payments.map((payment) => PrismaPaymentMapper.toDomain(payment));
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async save(payment: Payment): Promise<void> {
    const data = PrismaPaymentMapper.toPrismaUpdate(payment);

    try {
      await PrismaUnitOfWork.getClient(this.prisma).payment.update({
        where: {
          id: payment.id.toString(),
        },
        data,
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }
}
