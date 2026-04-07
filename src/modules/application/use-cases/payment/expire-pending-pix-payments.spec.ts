import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { makeAppointment } from "../../../../../tests/factories/appointment-factory";
import { makePayment } from "../../../../../tests/factories/payment-factory";
import { InMemoryAppointmentsRepository } from "../../../../../tests/repositories/in-memory-appointments-repository";
import { InMemoryPaymentsRepository } from "../../../../../tests/repositories/in-memory-payments-repository";
import { InMemoryUnitOfWork } from "../../../../../tests/repositories/in-memory-unit-of-work";
import { ExpirePendingPixPaymentsUseCase } from "./expire-pending-pix-payments";

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

let sut: ExpirePendingPixPaymentsUseCase;

describe("Expire pending pix payments", () => {
  beforeEach(() => {
    appointmentsRepository = new InMemoryAppointmentsRepository();
    paymentsRepository = new InMemoryPaymentsRepository();
    unitOfWork = new SpyUnitOfWork();

    sut = new ExpirePendingPixPaymentsUseCase(
      paymentsRepository,
      appointmentsRepository,
      unitOfWork,
    );
  });

  it("should expire the payment and appointment when the Pix deadline is reached", async () => {
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
    const referenceDate = new Date("2026-04-06T10:16:00");

    await appointmentsRepository.create(appointment);
    await paymentsRepository.create(payment);

    const result = await sut.execute({ referenceDate });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.expiredPayments).toHaveLength(1);
    expect(result.value.expiredPayments[0]?.status).toBe("EXPIRED");
    expect(result.value.expiredPayments[0]?.expiredAt).toEqual(referenceDate);
    expect(appointmentsRepository.items[0]?.status).toBe("EXPIRED");
    expect(appointmentsRepository.items[0]?.expiredAt).toEqual(referenceDate);
    expect(unitOfWork.executeCalls).toBe(1);
  });

  it("should skip pending payments that are still inside the Pix window", async () => {
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
      referenceDate: new Date("2026-04-06T10:14:59"),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.expiredPayments).toHaveLength(0);
    expect(paymentsRepository.items[0]?.status).toBe("PENDING");
    expect(appointmentsRepository.items[0]?.status).toBe("AWAITING_PAYMENT");
    expect(unitOfWork.executeCalls).toBe(0);
  });
});
