import {
  Payment as PrismaPayment,
  Prisma,
} from "../../../../generated/prisma/browser";
import { Payment } from "../../../../modules/payment/domain/entities/payment";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";

export class PrismaPaymentMapper {
  static toDomain(raw: PrismaPayment): Payment {
    return Payment.create(
      {
        appointmentId: new UniqueEntityId(raw.appointmentId),
        customerId: new UniqueEntityId(raw.customerId),
        establishmentId: new UniqueEntityId(raw.establishmentId),
        paymentMethod: raw.paymentMethod,
        amountInCents: raw.amountInCents,
        providerName: raw.providerName,
        providerPaymentId: raw.providerPaymentId,
        pixQrCode: raw.pixQrCode,
        pixCopyPasteCode: raw.pixCopyPasteCode,
        pixExpiresAt: raw.pixExpiresAt,
        status: raw.status,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        paidAt: raw.paidAt,
        expiredAt: raw.expiredAt,
        cancelledAt: raw.cancelledAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(raw: Payment): Prisma.PaymentUncheckedCreateInput {
    const createdAt = raw.createdAt ?? new Date();
    const updatedAt = raw.updatedAt ?? createdAt;

    return {
      id: raw.id.toString(),
      appointmentId: raw.appointmentId.toString(),
      customerId: raw.customerId.toString(),
      establishmentId: raw.establishmentId.toString(),
      paymentMethod: raw.paymentMethod,
      amountInCents: raw.amountInCents,
      providerName: raw.providerName,
      providerPaymentId: raw.providerPaymentId,
      pixQrCode: raw.pixQrCode,
      pixCopyPasteCode: raw.pixCopyPasteCode,
      pixExpiresAt: raw.pixExpiresAt,
      status: raw.status,
      createdAt,
      updatedAt,
      paidAt: raw.paidAt,
      expiredAt: raw.expiredAt,
      cancelledAt: raw.cancelledAt,
    };
  }

  static toPrismaUpdate(raw: Payment): Prisma.PaymentUncheckedUpdateInput {
    const data: Prisma.PaymentUncheckedUpdateInput = {
      appointmentId: raw.appointmentId.toString(),
      customerId: raw.customerId.toString(),
      establishmentId: raw.establishmentId.toString(),
      paymentMethod: raw.paymentMethod,
      amountInCents: raw.amountInCents,
      providerName: raw.providerName,
      providerPaymentId: raw.providerPaymentId,
      pixQrCode: raw.pixQrCode,
      pixCopyPasteCode: raw.pixCopyPasteCode,
      pixExpiresAt: raw.pixExpiresAt,
      status: raw.status,
      paidAt: raw.paidAt,
      expiredAt: raw.expiredAt,
      cancelledAt: raw.cancelledAt,
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
