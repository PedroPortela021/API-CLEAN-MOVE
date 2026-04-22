import {
  CheckoutRecovery as PrismaCheckoutRecovery,
  Prisma,
} from "../../../../generated/prisma/browser";
import { CheckoutRecovery } from "../../../../modules/payment/domain/entities/checkout-recovery";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";

export class PrismaCheckoutRecoveryMapper {
  static toDomain(raw: PrismaCheckoutRecovery): CheckoutRecovery {
    return CheckoutRecovery.create(
      {
        appointmentId: new UniqueEntityId(raw.appointmentId),
        paymentId: raw.paymentId ? new UniqueEntityId(raw.paymentId) : null,
        reason: raw.reason,
        appointmentCompensationPending: raw.appointmentCompensationPending,
        paymentCompensationPending: raw.paymentCompensationPending,
        failureMessage: raw.failureMessage,
        status: raw.status,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        resolvedAt: raw.resolvedAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(
    raw: CheckoutRecovery,
  ): Prisma.CheckoutRecoveryUncheckedCreateInput {
    return {
      id: raw.id.toString(),
      appointmentId: raw.appointmentId.toString(),
      paymentId: raw.paymentId?.toString() ?? null,
      reason: raw.reason,
      appointmentCompensationPending: raw.appointmentCompensationPending,
      paymentCompensationPending: raw.paymentCompensationPending,
      failureMessage: raw.failureMessage,
      status: raw.status,
      createdAt: raw.createdAt ?? new Date(),
      updatedAt: raw.updatedAt ?? new Date(),
      resolvedAt: raw.resolvedAt,
    };
  }

  static toPrismaUpdate(
    raw: CheckoutRecovery,
  ): Prisma.CheckoutRecoveryUncheckedUpdateInput {
    const data: Prisma.CheckoutRecoveryUncheckedUpdateInput = {
      appointmentId: raw.appointmentId.toString(),
      paymentId: raw.paymentId?.toString() ?? null,
      reason: raw.reason,
      appointmentCompensationPending: raw.appointmentCompensationPending,
      paymentCompensationPending: raw.paymentCompensationPending,
      failureMessage: raw.failureMessage,
      status: raw.status,
      resolvedAt: raw.resolvedAt,
    };

    if (raw.createdAt !== null) {
      data.createdAt = raw.createdAt;
    }

    if (raw.updatedAt !== null) {
      data.updatedAt = raw.updatedAt;
    }

    return data;
  }
}
