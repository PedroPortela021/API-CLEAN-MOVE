import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { makeAppointment } from "../../../../../tests/factories/appointment-factory";
import { makePayment } from "../../../../../tests/factories/payment-factory";
import { InMemoryAppointmentsRepository } from "../../../../../tests/repositories/in-memory-appointments-repository";
import { InMemoryPaymentsRepository } from "../../../../../tests/repositories/in-memory-payments-repository";
import { GetCheckoutStatusUseCase } from "./get-checkout-status";

let appointmentsRepository: InMemoryAppointmentsRepository;
let paymentsRepository: InMemoryPaymentsRepository;

let sut: GetCheckoutStatusUseCase;

describe("Get checkout status", () => {
  beforeEach(() => {
    appointmentsRepository = new InMemoryAppointmentsRepository();
    paymentsRepository = new InMemoryPaymentsRepository();

    sut = new GetCheckoutStatusUseCase(
      paymentsRepository,
      appointmentsRepository,
    );
  });

  it("should return pending when the checkout is still awaiting payment", async () => {
    const appointment = makeAppointment(
      {
        status: "AWAITING_PAYMENT",
        reservationExpiresAt: new Date("2026-04-06T10:15:00"),
      },
      new UniqueEntityId("appointment-1"),
    );
    const payment = makePayment(
      {
        appointmentId: appointment.id,
        customerId: appointment.customerId,
        establishmentId: appointment.establishmentId,
        amountInCents: appointment.service.priceInCents,
        status: "PENDING",
        providerName: "FakePix",
        providerPaymentId: "pix-payment-1",
        pixQrCode: "qr-code",
        pixCopyPasteCode: "copy-paste",
        pixExpiresAt: new Date("2026-04-06T10:15:00"),
      },
      new UniqueEntityId("payment-1"),
    );

    await appointmentsRepository.create(appointment);
    await paymentsRepository.create(payment);

    const result = await sut.execute({
      paymentId: payment.id.toString(),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.status).toBe("PENDING");
  });

  it("should return paid when the payment has already been confirmed", async () => {
    const appointment = makeAppointment(
      {
        status: "SCHEDULED",
        confirmedAt: new Date("2026-04-06T10:10:00"),
      },
      new UniqueEntityId("appointment-1"),
    );
    const payment = makePayment(
      {
        appointmentId: appointment.id,
        customerId: appointment.customerId,
        establishmentId: appointment.establishmentId,
        amountInCents: appointment.service.priceInCents,
        status: "PAID",
        providerName: "FakePix",
        providerPaymentId: "pix-payment-1",
        pixQrCode: "qr-code",
        pixCopyPasteCode: "copy-paste",
        pixExpiresAt: new Date("2026-04-06T10:15:00"),
        paidAt: new Date("2026-04-06T10:10:00"),
      },
      new UniqueEntityId("payment-1"),
    );

    await appointmentsRepository.create(appointment);
    await paymentsRepository.create(payment);

    const result = await sut.execute({
      paymentId: payment.id.toString(),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.status).toBe("PAID");
  });

  it("should return expired when the checkout is no longer payable", async () => {
    const appointment = makeAppointment(
      {
        status: "EXPIRED",
        expiredAt: new Date("2026-04-06T10:16:00"),
        reservationExpiresAt: null,
      },
      new UniqueEntityId("appointment-1"),
    );
    const payment = makePayment(
      {
        appointmentId: appointment.id,
        customerId: appointment.customerId,
        establishmentId: appointment.establishmentId,
        amountInCents: appointment.service.priceInCents,
        status: "EXPIRED",
        providerName: "FakePix",
        providerPaymentId: "pix-payment-1",
        pixQrCode: "qr-code",
        pixCopyPasteCode: "copy-paste",
        pixExpiresAt: new Date("2026-04-06T10:15:00"),
        expiredAt: new Date("2026-04-06T10:16:00"),
      },
      new UniqueEntityId("payment-1"),
    );

    await appointmentsRepository.create(appointment);
    await paymentsRepository.create(payment);

    const result = await sut.execute({
      paymentId: payment.id.toString(),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.status).toBe("EXPIRED");
  });

  it("should return a resource not found error when the payment does not exist", async () => {
    const result = await sut.execute({
      paymentId: "missing-payment",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
