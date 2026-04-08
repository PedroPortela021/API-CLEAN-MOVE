import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { InvalidPaymentError, Payment } from "./payment";
import { InvalidPaymentStatusTransitionError } from "../errors/invalid-payment-status-transition-error";

describe("Payment", () => {
  it("should create an initiated Pix payment by default", () => {
    const payment = Payment.create({
      appointmentId: new UniqueEntityId("appointment-1"),
      customerId: new UniqueEntityId("customer-1"),
      establishmentId: new UniqueEntityId("establishment-1"),
      amountInCents: 15000,
    });

    expect(payment.paymentMethod).toBe("PIX");
    expect(payment.status).toBe("INITIATED");
    expect(payment.providerPaymentId).toBeNull();
    expect(payment.pixQrCode).toBeNull();
    expect(payment.paidAt).toBeNull();
  });

  it("should not create a payment with a non-positive amount", () => {
    expect(() =>
      Payment.create({
        appointmentId: new UniqueEntityId("appointment-1"),
        customerId: new UniqueEntityId("customer-1"),
        establishmentId: new UniqueEntityId("establishment-1"),
        amountInCents: 0,
      }),
    ).toThrow(InvalidPaymentError);
  });

  it("should issue a Pix charge for an initiated payment", () => {
    const payment = Payment.create({
      appointmentId: new UniqueEntityId("appointment-1"),
      customerId: new UniqueEntityId("customer-1"),
      establishmentId: new UniqueEntityId("establishment-1"),
      amountInCents: 15000,
    });
    const referenceDate = new Date("2026-04-06T10:00:00");

    payment.issuePixCharge(
      {
        providerName: "Pagarme",
        providerPaymentId: "pix-123",
        pixQrCode: "qr-code-image",
        pixCopyPasteCode: "copy-paste-code",
        pixExpiresAt: new Date("2026-04-06T10:15:00"),
      },
      referenceDate,
    );

    expect(payment.status).toBe("PENDING");
    expect(payment.providerName).toBe("Pagarme");
    expect(payment.providerPaymentId).toBe("pix-123");
    expect(payment.pixQrCode).toBe("qr-code-image");
    expect(payment.pixCopyPasteCode).toBe("copy-paste-code");
    expect(payment.pixExpiresAt).toEqual(new Date("2026-04-06T10:15:00"));
    expect(payment.updatedAt).toEqual(referenceDate);
  });

  it("should not issue a Pix charge with an expired deadline", () => {
    const payment = Payment.create({
      appointmentId: new UniqueEntityId("appointment-1"),
      customerId: new UniqueEntityId("customer-1"),
      establishmentId: new UniqueEntityId("establishment-1"),
      amountInCents: 15000,
    });

    expect(() =>
      payment.issuePixCharge(
        {
          providerName: "Pagarme",
          providerPaymentId: "pix-123",
          pixQrCode: "qr-code-image",
          pixCopyPasteCode: "copy-paste-code",
          pixExpiresAt: new Date("2026-04-06T10:15:00"),
        },
        new Date("2026-04-06T10:15:00"),
      ),
    ).toThrow(InvalidPaymentError);
  });

  it("should mark a pending payment as paid", () => {
    const payment = Payment.create({
      appointmentId: new UniqueEntityId("appointment-1"),
      customerId: new UniqueEntityId("customer-1"),
      establishmentId: new UniqueEntityId("establishment-1"),
      amountInCents: 15000,
      status: "PENDING",
      providerName: "Pagarme",
      providerPaymentId: "pix-123",
      pixQrCode: "qr-code-image",
      pixCopyPasteCode: "copy-paste-code",
      pixExpiresAt: new Date("2026-04-06T10:15:00"),
    });
    const paidAt = new Date("2026-04-06T10:10:00");

    payment.markAsPaid(paidAt);

    expect(payment.status).toBe("PAID");
    expect(payment.paidAt).toEqual(paidAt);
    expect(payment.updatedAt).toEqual(paidAt);
  });

  it("should not mark a non-pending payment as paid", () => {
    const payment = Payment.create({
      appointmentId: new UniqueEntityId("appointment-1"),
      customerId: new UniqueEntityId("customer-1"),
      establishmentId: new UniqueEntityId("establishment-1"),
      amountInCents: 15000,
    });

    expect(() => payment.markAsPaid()).toThrow(
      InvalidPaymentStatusTransitionError,
    );
  });

  it("should expire a pending payment after the Pix deadline", () => {
    const payment = Payment.create({
      appointmentId: new UniqueEntityId("appointment-1"),
      customerId: new UniqueEntityId("customer-1"),
      establishmentId: new UniqueEntityId("establishment-1"),
      amountInCents: 15000,
      status: "PENDING",
      providerName: "Pagarme",
      providerPaymentId: "pix-123",
      pixQrCode: "qr-code-image",
      pixCopyPasteCode: "copy-paste-code",
      pixExpiresAt: new Date("2026-04-06T10:15:00"),
    });
    const expiredAt = new Date("2026-04-06T10:16:00");

    payment.expire(expiredAt);

    expect(payment.status).toBe("EXPIRED");
    expect(payment.expiredAt).toEqual(expiredAt);
    expect(payment.isPixExpired(expiredAt)).toBe(true);
  });

  it("should not expire a pending payment before the Pix deadline", () => {
    const payment = Payment.create({
      appointmentId: new UniqueEntityId("appointment-1"),
      customerId: new UniqueEntityId("customer-1"),
      establishmentId: new UniqueEntityId("establishment-1"),
      amountInCents: 15000,
      status: "PENDING",
      providerName: "Pagarme",
      providerPaymentId: "pix-123",
      pixQrCode: "qr-code-image",
      pixCopyPasteCode: "copy-paste-code",
      pixExpiresAt: new Date("2026-04-06T10:15:00"),
    });

    expect(() => payment.expire(new Date("2026-04-06T10:14:59"))).toThrow(
      InvalidPaymentStatusTransitionError,
    );
  });

  it("should cancel an initiated payment", () => {
    const payment = Payment.create({
      appointmentId: new UniqueEntityId("appointment-1"),
      customerId: new UniqueEntityId("customer-1"),
      establishmentId: new UniqueEntityId("establishment-1"),
      amountInCents: 15000,
    });
    const cancelledAt = new Date("2026-04-06T10:05:00");

    payment.cancel(cancelledAt);

    expect(payment.status).toBe("CANCELLED");
    expect(payment.cancelledAt).toEqual(cancelledAt);
  });

  it("should not cancel a paid payment", () => {
    const payment = Payment.create({
      appointmentId: new UniqueEntityId("appointment-1"),
      customerId: new UniqueEntityId("customer-1"),
      establishmentId: new UniqueEntityId("establishment-1"),
      amountInCents: 15000,
      status: "PAID",
      paidAt: new Date("2026-04-06T10:10:00"),
    });

    expect(() => payment.cancel()).toThrow(InvalidPaymentStatusTransitionError);
  });
});
