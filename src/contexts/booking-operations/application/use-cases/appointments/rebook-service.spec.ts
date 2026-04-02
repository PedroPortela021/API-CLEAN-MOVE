import { EstablishmentClosedError } from "../../../domain/establishments/errors/establishment-closed-error";
import { InvalidBookServiceInputError } from "../../../domain/scheduling/errors/invalid-book-service-input-error";
import { TimeSlotAlreadyBookedError } from "../../../domain/scheduling/errors/time-slot-already-booked-error";
import { TimeSlot } from "../../../domain/scheduling/value-objects/time-slot";
import { NotAllowedError } from "../../../../../shared/errors/not-allowed-error";
import { ResourceNotFoundError } from "../../../../../shared/errors/resource-not-found-error";
import { UniqueEntityId } from "../../../../../shared/entities/unique-entity-id";
import { makeEstablishment } from "../../../../../tests/factories/establishment-factory";
import { InMemoryAppointmentsRepository } from "../../../../../tests/repositories/in-memory-appointments-repository";
import { InMemoryEstablishmentsRepository } from "../../../../../tests/repositories/in-memory-establishment-repository";
import { RebookServiceUseCase } from "./rebook-service";
import { makeAppointment } from "../../../../../tests/factories/appointment-factory";

let appointmentsRepository: InMemoryAppointmentsRepository;
let establishmentsRepository: InMemoryEstablishmentsRepository;

let sut: RebookServiceUseCase;

describe("Rebook service", () => {
  beforeEach(() => {
    appointmentsRepository = new InMemoryAppointmentsRepository();
    establishmentsRepository = new InMemoryEstablishmentsRepository();

    sut = new RebookServiceUseCase(
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
      startsAt: new Date("2026-04-06T14:00:00"),
    });

    expect(result.isLeft()).toBe(true);

    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(appointmentsRepository.items).toHaveLength(0);
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
      startsAt: new Date("2026-04-06T14:00:00"),
    });

    expect(result.isLeft()).toBe(true);

    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(appointmentsRepository.items[0]?.slot.startsAt).toEqual(
      new Date("2026-04-06T10:00:00"),
    );
  });

  it("should return a closed establishment error when the new slot is outside operating hours", async () => {
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
      startsAt: new Date("2026-04-06T19:00:00"),
    });

    expect(result.isLeft()).toBe(true);

    expect(result.value).toBeInstanceOf(EstablishmentClosedError);
    expect(appointmentsRepository.items[0]?.slot.startsAt).toEqual(
      new Date("2026-04-06T10:00:00"),
    );
  });

  it("should be able to rebook an appointment to a new valid slot", async () => {
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
        authorType: "CUSTOMER",
        authorId: appointment.customerId.toString(),
      },
      startsAt: new Date("2026-04-06T14:00:00"),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.appointment).toBe(appointmentsRepository.items[0]);
    expect(result.value.appointment.slot.startsAt).toEqual(
      new Date("2026-04-06T14:00:00"),
    );
    expect(result.value.appointment.slot.endsAt).toEqual(
      new Date("2026-04-06T15:00:00"),
    );
  });

  it("should return a conflict error when another appointment overlaps the requested slot", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const appointment = makeAppointment(
      {
        establishmentId: establishment.id,
      },
      new UniqueEntityId("appointment-1"),
    );
    const conflictingAppointment = makeAppointment(
      {
        establishmentId: establishment.id,
        slot: TimeSlot.create({
          startsAt: new Date("2026-04-06T13:00:00"),
          endsAt: new Date("2026-04-06T14:00:00"),
        }),
      },
      new UniqueEntityId("appointment-2"),
    );

    await establishmentsRepository.create(establishment);
    await appointmentsRepository.create(appointment);
    await appointmentsRepository.create(conflictingAppointment);

    const result = await sut.execute({
      appointmentId: appointment.id.toString(),
      author: {
        authorType: "CUSTOMER",
        authorId: appointment.customerId.toString(),
      },
      startsAt: new Date("2026-04-06T13:30:00"),
    });

    expect(result.isLeft()).toBe(true);

    expect(result.value).toBeInstanceOf(TimeSlotAlreadyBookedError);
    expect(appointmentsRepository.items[0]?.slot.startsAt).toEqual(
      new Date("2026-04-06T10:00:00"),
    );
  });

  it("should ignore the same appointment and cancelled appointments when checking conflicts", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const appointment = makeAppointment(
      {
        establishmentId: establishment.id,
      },
      new UniqueEntityId("appointment-1"),
    );
    const cancelledAppointment = makeAppointment(
      {
        establishmentId: establishment.id,
        status: "CANCELLED",
        cancelledAt: new Date("2026-04-05T10:00:00"),
        slot: TimeSlot.create({
          startsAt: new Date("2026-04-06T10:30:00"),
          endsAt: new Date("2026-04-06T11:30:00"),
        }),
      },
      new UniqueEntityId("appointment-2"),
    );

    await establishmentsRepository.create(establishment);
    await appointmentsRepository.create(appointment);
    await appointmentsRepository.create(cancelledAppointment);

    const result = await sut.execute({
      appointmentId: appointment.id.toString(),
      author: {
        authorType: "ESTABLISHMENT",
        authorId: establishment.id.toString(),
      },
      startsAt: new Date("2026-04-06T10:00:00"),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.appointment.slot.startsAt).toEqual(
      new Date("2026-04-06T10:00:00"),
    );
    expect(appointmentsRepository.items).toHaveLength(2);
  });

  it("should return invalid input when the appointment status cannot be rescheduled", async () => {
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
        authorType: "CUSTOMER",
        authorId: appointment.customerId.toString(),
      },
      startsAt: new Date("2026-04-06T14:00:00"),
    });

    expect(result.isLeft()).toBe(true);

    expect(result.value).toBeInstanceOf(InvalidBookServiceInputError);
    expect(appointmentsRepository.items[0]?.slot.startsAt).toEqual(
      new Date("2026-04-06T10:00:00"),
    );
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
      startsAt: new Date("2026-04-06T14:00:00"),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
    expect(appointmentsRepository.items[0]?.slot.startsAt).toEqual(
      new Date("2026-04-06T10:00:00"),
    );
  });
});
