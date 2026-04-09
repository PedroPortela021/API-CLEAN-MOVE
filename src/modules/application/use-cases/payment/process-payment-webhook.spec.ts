import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { makeAppointment } from "../../../../../tests/factories/appointment-factory";
import { makePayment } from "../../../../../tests/factories/payment-factory";
import { InMemoryAppointmentsRepository } from "../../../../../tests/repositories/in-memory-appointments-repository";
import { InMemoryPaymentsRepository } from "../../../../../tests/repositories/in-memory-payments-repository";
import { InMemoryUnitOfWork } from "../../../../../tests/repositories/in-memory-unit-of-work";
import { registerDomainEventSubscribers } from "../../subscribers/register-domain-event-subscribers";
import { ProcessPaymentWebhookUseCase } from "./process-payment-webhook";

class SpyUnitOfWork extends InMemoryUnitOfWork {
  public executeCalls = 0;

  async execute<T>(work: () => Promise<T>): Promise<T> {
    this.executeCalls += 1;
    return super.execute(work);
  }
}

let appointmentsRepository: InMemoryAppointmentsRepository;
let paymentsRepository: InMemoryPaymentsRepository;
let unitOfWork: SpyUnitOfWork;

let sut: ProcessPaymentWebhookUseCase;

describe("Process payment webhook", () => {
  beforeEach(() => {
    appointmentsRepository = new InMemoryAppointmentsRepository();
    paymentsRepository = new InMemoryPaymentsRepository();
    unitOfWork = new SpyUnitOfWork();
    registerDomainEventSubscribers({
      appointmentsRepository,
      paymentsRepository,
    });

    sut = new ProcessPaymentWebhookUseCase(
      paymentsRepository,
      appointmentsRepository,
      unitOfWork,
    );
  });

  it("should mark the payment as paid and confirm the appointment", async () => {
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
    const paidAt = new Date("2026-04-06T10:10:00");

    await appointmentsRepository.create(appointment);
    await paymentsRepository.create(payment);

    const result = await sut.execute({
      providerName: "FakePix",
      providerPaymentId: "pix-payment-1",
      paidAt,
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.alreadyProcessed).toBe(false);
    expect(result.value.payment.status).toBe("PAID");
    expect(result.value.payment.paidAt).toEqual(paidAt);
    expect(result.value.appointment.status).toBe("SCHEDULED");
    expect(result.value.appointment.confirmedAt).toEqual(paidAt);
    expect(unitOfWork.executeCalls).toBe(1);
  });

  it("should be idempotent when the payment has already been processed", async () => {
    const appointment = makeAppointment(
      {
        status: "SCHEDULED",
        confirmedAt: new Date("2026-04-06T10:10:00"),
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
      providerName: "FakePix",
      providerPaymentId: "pix-payment-1",
      paidAt: new Date("2026-04-06T10:11:00"),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.alreadyProcessed).toBe(true);
    expect(unitOfWork.executeCalls).toBe(0);
  });

  it("should reconcile the appointment when the payment is already paid", async () => {
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
    const paidAt = new Date("2026-04-06T10:10:00");

    await appointmentsRepository.create(appointment);
    await paymentsRepository.create(payment);

    const result = await sut.execute({
      providerName: "FakePix",
      providerPaymentId: "pix-payment-1",
      paidAt,
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.alreadyProcessed).toBe(false);
    expect(result.value.payment.status).toBe("PAID");
    expect(result.value.appointment.status).toBe("SCHEDULED");
    expect(result.value.appointment.confirmedAt).toEqual(paidAt);
    expect(unitOfWork.executeCalls).toBe(1);
  });

  it("should return a resource not found error when the payment does not exist", async () => {
    const result = await sut.execute({
      providerName: "FakePix",
      providerPaymentId: "missing-payment",
      paidAt: new Date("2026-04-06T10:10:00"),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(unitOfWork.executeCalls).toBe(0);
  });
});
