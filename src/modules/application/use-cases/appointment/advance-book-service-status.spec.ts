import { NotAllowedError } from "../../../../shared/errors/not-allowed-error";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { InvalidAppointmentStatusTransitionError } from "../../../scheduling/domain/errors/invalid-appointment-status-transition-error";
import { makeAppointment } from "../../../../../tests/factories/appointment-factory";
import { makeEstablishment } from "../../../../../tests/factories/establishment-factory";
import { InMemoryAppointmentsRepository } from "../../../../../tests/repositories/in-memory-appointments-repository";
import { InMemoryEstablishmentsRepository } from "../../../../../tests/repositories/in-memory-establishment-repository";
import { InMemoryServicesRepository } from "../../../../../tests/repositories/in-memory-services-repository";
import { AdvanceBookServiceStatusUseCase } from "./advance-book-service-status";

let appointmentsRepository: InMemoryAppointmentsRepository;
let establishmentsRepository: InMemoryEstablishmentsRepository;

let sut: AdvanceBookServiceStatusUseCase;

describe("Advance book service status", () => {
  beforeEach(() => {
    appointmentsRepository = new InMemoryAppointmentsRepository();
    establishmentsRepository = new InMemoryEstablishmentsRepository(
      new InMemoryServicesRepository(),
    );

    sut = new AdvanceBookServiceStatusUseCase(
      appointmentsRepository,
      establishmentsRepository,
    );
  });

  it("should return a resource not found error when the appointment does not exist", async () => {
    const result = await sut.execute({
      appointmentId: "appointment-1",
      author: {
        authorType: "ESTABLISHMENT",
        authorId: "est-1",
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(appointmentsRepository.items).toHaveLength(0);
  });

  it("should return not allowed when the author is the customer of the appointment", async () => {
    const appointment = makeAppointment(
      {
        establishmentId: new UniqueEntityId("est-1"),
        customerId: new UniqueEntityId("customer-1"),
      },
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
    expect(result.value).toBeInstanceOf(NotAllowedError);
    expect(appointmentsRepository.items[0]?.status).toBe("SCHEDULED");
  });

  it("should return not allowed when the author is another establishment", async () => {
    const appointment = makeAppointment(
      {
        establishmentId: new UniqueEntityId("est-1"),
      },
      new UniqueEntityId("appointment-1"),
    );

    await appointmentsRepository.create(appointment);

    const result = await sut.execute({
      appointmentId: appointment.id.toString(),
      author: {
        authorType: "ESTABLISHMENT",
        authorId: "est-2",
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
    expect(appointmentsRepository.items[0]?.status).toBe("SCHEDULED");
  });

  it("should return a resource not found error when the appointment establishment does not exist", async () => {
    const appointment = makeAppointment(
      {
        establishmentId: new UniqueEntityId("est-1"),
      },
      new UniqueEntityId("appointment-1"),
    );

    await appointmentsRepository.create(appointment);

    const result = await sut.execute({
      appointmentId: appointment.id.toString(),
      author: {
        authorType: "ESTABLISHMENT",
        authorId: appointment.establishmentId.toString(),
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(appointmentsRepository.items[0]?.status).toBe("SCHEDULED");
  });

  it("should advance the appointment from scheduled to in progress", async () => {
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

    expect(result.value.appointment.status).toBe("IN_PROGRESS");
    expect(result.value.appointment).toBe(appointmentsRepository.items[0]);
  });

  it("should advance the appointment from in progress to finished", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const appointment = makeAppointment(
      {
        establishmentId: establishment.id,
        status: "IN_PROGRESS",
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

    expect(result.value.appointment.status).toBe("FINISHED");
    expect(result.value.appointment).toBe(appointmentsRepository.items[0]);
  });

  it("should return invalid transition when the appointment is cancelled", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const appointment = makeAppointment(
      {
        establishmentId: establishment.id,
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
        authorType: "ESTABLISHMENT",
        authorId: establishment.id.toString(),
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(
      InvalidAppointmentStatusTransitionError,
    );
    expect(appointmentsRepository.items[0]?.status).toBe("CANCELLED");
  });

  it("should return invalid transition when the appointment is already finished", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const appointment = makeAppointment(
      {
        establishmentId: establishment.id,
        status: "FINISHED",
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

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(
      InvalidAppointmentStatusTransitionError,
    );
    expect(appointmentsRepository.items[0]?.status).toBe("FINISHED");
  });
});
