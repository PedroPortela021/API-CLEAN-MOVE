import {
  Payment,
  PaymentProps,
} from "../../src/modules/payment/domain/entities/payment";
import { UniqueEntityId } from "../../src/shared/entities/unique-entity-id";

export function makePayment(
  override?: Partial<PaymentProps>,
  id?: UniqueEntityId,
) {
  const payment = Payment.create(
    {
      appointmentId: new UniqueEntityId(),
      customerId: new UniqueEntityId(),
      establishmentId: new UniqueEntityId(),
      amountInCents: 30000,
      paymentMethod: "PIX",
      providerName: null,
      providerPaymentId: null,
      pixQrCode: null,
      pixCopyPasteCode: null,
      pixExpiresAt: null,
      status: "INITIATED",
      createdAt: new Date("2026-04-01T08:00:00"),
      updatedAt: new Date("2026-04-01T08:00:00"),
      paidAt: null,
      expiredAt: null,
      cancelledAt: null,
      ...override,
    },
    id,
  );

  return payment;
}
