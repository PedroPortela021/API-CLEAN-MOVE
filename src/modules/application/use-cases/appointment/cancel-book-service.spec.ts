import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { NotAllowedError } from "../../../../shared/errors/not-allowed-error";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { InvalidAppointmentStatusTransitionError } from "../../../scheduling/domain/errors/invalid-appointment-status-transition-error";
import { makeAppointment } from "../../../../../tests/factories/appointment-factory";
import { makeEstablishment } from "../../../../../tests/factories/establishment-factory";
import { InMemoryAppointmentsRepository } from "../../../../../tests/repositories/in-memory-appointments-repository";
import { InMemoryEstablishmentsRepository } from "../../../../../tests/repositories/in-memory-establishment-repository";
import { InMemoryServicesRepository } from "../../../../../tests/repositories/in-memory-services-repository";
import { CancelBookServiceUseCase } from "./cancel-book-service";

let appointmentsRepository: InMemoryAppointmentsRepository;
let establishmentsRepository: InMemoryEstablishmentsRepository;

let sut: CancelBookServiceUseCase;

describe("Cancel book service", () => {
  beforeEach(() => {
    appointmentsRepository = new InMemoryAppointmentsRepository();
    establishmentsRepository = new InMemoryEstablishmentsRepository(
      new InMemoryServicesRepository(),
    );

    sut = new CancelBookServiceUseCase(
      appointmentsRepository,
      establishmentsRepository,
    );
  });

  it("should return a resource not found error when the appointment does not exist", async () => {
    const result = await sut.execute({
      appointmentId: "appointment-1",
      author: {
        authorType: "CUSTOMER",
        authorId: "customer-1",
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should return a resource not found error when the appointment establishment does not exist", async () => {
    const appointment = makeAppointment(
      {},
      new UniqueEntityId("appointment-1"),
    );

    await appointmentsRepository.create(appointment);

    const result = await sut.execute({
      appointmentId: appointment.id.toString(),
      author: {
        authorType: "CUSTOMER",
        authorId: appointment.customerId.toString(),
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(appointmentsRepository.items[0]?.status).toBe("SCHEDULED");
  });

  it("should cancel an appointment when the customer is the author", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const appointment = makeAppointment(
      {
        establishmentId: establishment.id,
        customerId: new UniqueEntityId("customer-1"),
      },
      new UniqueEntityId("appointment-1"),
    );

    await establishmentsRepository.create(establishment);
    await appointmentsRepository.create(appointment);

    const result = await sut.execute({
      appointmentId: appointment.id.toString(),
      author: {
        authorType: "CUSTOMER",
        authorId: appointment.customerId.toString(),
      },
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.appointment.status).toBe("CANCELLED");
    expect(result.value.appointment.cancelledAt).toBeInstanceOf(Date);
    expect(appointmentsRepository.items[0]).toBe(result.value.appointment);
  });

  it("should cancel an appointment when the establishment is the author", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const appointment = makeAppointment(
      {
        establishmentId: establishment.id,
      },
      new UniqueEntityId("appointment-1"),
    );

    await establishmentsRepository.create(establishment);
    await appointmentsRepository.create(appointment);

    const result = await sut.execute({
      appointmentId: appointment.id.toString(),
      author: {
        authorType: "ESTABLISHMENT",
        authorId: establishment.id.toString(),
      },
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.appointment.status).toBe("CANCELLED");
  });

  it("should cancel an appointment awaiting payment and clear the reservation deadline", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const appointment = makeAppointment(
      {
        establishmentId: establishment.id,
        customerId: new UniqueEntityId("customer-1"),
        status: "AWAITING_PAYMENT",
        reservationExpiresAt: new Date("2099-04-06T10:15:00"),
      },
      new UniqueEntityId("appointment-1"),
    );

    await establishmentsRepository.create(establishment);
    await appointmentsRepository.create(appointment);

    const result = await sut.execute({
      appointmentId: appointment.id.toString(),
      author: {
        authorType: "CUSTOMER",
        authorId: appointment.customerId.toString(),
      },
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.appointment.status).toBe("CANCELLED");
    expect(result.value.appointment.reservationExpiresAt).toBeNull();
    expect(result.value.appointment.cancelledAt).toBeInstanceOf(Date);
  });

  it("should return not allowed when the author does not own the appointment or establishment", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const appointment = makeAppointment(
      {
        establishmentId: establishment.id,
        customerId: new UniqueEntityId("customer-1"),
      },
      new UniqueEntityId("appointment-1"),
    );

    await establishmentsRepository.create(establishment);
    await appointmentsRepository.create(appointment);

    const result = await sut.execute({
      appointmentId: appointment.id.toString(),
      author: {
        authorType: "CUSTOMER",
        authorId: "customer-2",
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
    expect(appointmentsRepository.items[0]?.status).toBe("SCHEDULED");
  });

  it("should return invalid appointment status transition when the appointment is already cancelled", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const appointment = makeAppointment(
      {
        establishmentId: establishment.id,
        customerId: new UniqueEntityId("customer-1"),
        status: "CANCELLED",
        cancelledAt: new Date("2026-04-05T10:00:00"),
      },
      new UniqueEntityId("appointment-1"),
    );

    await establishmentsRepository.create(establishment);
    await appointmentsRepository.create(appointment);

    const result = await sut.execute({
      appointmentId: appointment.id.toString(),
      author: {
        authorType: "CUSTOMER",
        authorId: appointment.customerId.toString(),
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(
      InvalidAppointmentStatusTransitionError,
    );
    expect(appointmentsRepository.items[0]?.cancelledAt).toEqual(
      new Date("2026-04-05T10:00:00"),
    );
  });
});
