import { InactiveServiceError } from "../../../catalog/domain/errors/inactive-service-error";
import { EstimatedDuration } from "../../../catalog/domain/value-objects/estimated-duration";
import { EstablishmentClosedError } from "../../../establishments/domain/errors/establishment-closed-error";
import { OperatingHours } from "../../../establishments/domain/value-objects/operating-hours";
import { TimeSlotAlreadyBookedError } from "../../../scheduling/domain/errors/time-slot-already-booked-error";
import { NotAllowedError } from "../../../../shared/errors/not-allowed-error";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { makeCustomer } from "../../../../../tests/factories/customer-factory";
import { makeEstablishment } from "../../../../../tests/factories/establishment-factory";
import { makeService } from "../../../../../tests/factories/service-factory";
import { InMemoryAppointmentsRepository } from "../../../../../tests/repositories/in-memory-appointments-repository";
import { InMemoryCustomersRepository } from "../../../../../tests/repositories/in-memory-customers-repository";
import { InMemoryEstablishmentsRepository } from "../../../../../tests/repositories/in-memory-establishment-repository";
import { InMemoryServicesRepository } from "../../../../../tests/repositories/in-memory-services-repository";
import { BookServiceUseCase } from "./book-service";

let appointmentsRepository: InMemoryAppointmentsRepository;
let establishmentsRepository: InMemoryEstablishmentsRepository;
let customersRepository: InMemoryCustomersRepository;
let servicesRepository: InMemoryServicesRepository;

let sut: BookServiceUseCase;

describe("Book service", () => {
  beforeEach(() => {
    appointmentsRepository = new InMemoryAppointmentsRepository();
    servicesRepository = new InMemoryServicesRepository();
    establishmentsRepository = new InMemoryEstablishmentsRepository(
      servicesRepository,
    );
    customersRepository = new InMemoryCustomersRepository();

    sut = new BookServiceUseCase(
      appointmentsRepository,
      establishmentsRepository,
      customersRepository,
      servicesRepository,
    );
  });

  it("should return not allowed when the author cannot book for the customer", async () => {
    const result = await sut.execute({
      establishmentId: "est-1",
      customerId: "customer-1",
      serviceId: "service-1",
      author: {
        authorType: "CUSTOMER",
        authorId: "customer-2",
      },
      startsAt: new Date("2026-04-06T10:00:00"),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
    expect(customersRepository.items).toHaveLength(0);
    expect(appointmentsRepository.items).toHaveLength(0);
  });

  it("should return an inactive service error before looking up customer or appointments", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const service = makeService({
      establishmentId: establishment.id,
      isActive: false,
    });

    await establishmentsRepository.create(establishment);
    await servicesRepository.create(service);

    const result = await sut.execute({
      establishmentId: establishment.id.toString(),
      customerId: "customer-1",
      serviceId: service.id.toString(),
      author: {
        authorType: "CUSTOMER",
        authorId: "customer-1",
      },
      startsAt: new Date("2026-04-06T10:00:00"),
    });

    if (result.isRight()) {
      throw new Error("Expected inactive service error.");
    }

    expect(result.value).toBeInstanceOf(InactiveServiceError);
    expect(customersRepository.items).toHaveLength(0);
    expect(appointmentsRepository.items).toHaveLength(0);
  });

  it("should return a closed establishment error before looking up customer or appointments", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const service = makeService({
      establishmentId: establishment.id,
    });

    await establishmentsRepository.create(establishment);
    await servicesRepository.create(service);

    const result = await sut.execute({
      establishmentId: establishment.id.toString(),
      customerId: "customer-1",
      serviceId: service.id.toString(),
      author: {
        authorType: "CUSTOMER",
        authorId: "customer-1",
      },
      startsAt: new Date("2026-04-06T19:00:00"),
    });

    if (result.isRight()) {
      throw new Error("Expected establishment closed error.");
    }

    expect(result.value).toBeInstanceOf(EstablishmentClosedError);
    expect(appointmentsRepository.items).toHaveLength(0);
  });

  it("should return a closed establishment error when the appointment crosses midnight", async () => {
    const establishment = makeEstablishment(
      {
        operatingHours: OperatingHours.create({
          days: [
            {
              day: "MONDAY",
              ranges: [{ start: "23:00", end: "23:59" }],
            },
            {
              day: "TUESDAY",
              ranges: [{ start: "00:00", end: "01:00" }],
            },
          ],
        }),
      },
      new UniqueEntityId("est-1"),
    );
    const service = makeService({
      establishmentId: establishment.id,
      estimatedDuration: EstimatedDuration.create({
        minInMinutes: 60,
        maxInMinutes: 60,
      }),
    });

    await establishmentsRepository.create(establishment);
    await servicesRepository.create(service);

    const result = await sut.execute({
      establishmentId: establishment.id.toString(),
      customerId: "customer-1",
      serviceId: service.id.toString(),
      author: {
        authorType: "CUSTOMER",
        authorId: "customer-1",
      },
      startsAt: new Date("2026-04-06T23:30:00"),
    });

    if (result.isRight()) {
      throw new Error(
        "Expected establishment closed error for overnight slot.",
      );
    }

    expect(result.value).toBeInstanceOf(EstablishmentClosedError);
    expect(appointmentsRepository.items).toHaveLength(0);
  });

  it("should book a service when the customer is the author", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const customer = makeCustomer({}, new UniqueEntityId("customer-1"));
    const service = makeService({
      establishmentId: establishment.id,
    });

    await establishmentsRepository.create(establishment);
    await customersRepository.create(customer);
    await servicesRepository.create(service);

    const result = await sut.execute({
      establishmentId: establishment.id.toString(),
      customerId: customer.id.toString(),
      serviceId: service.id.toString(),
      author: {
        authorType: "CUSTOMER",
        authorId: customer.id.toString(),
      },
      startsAt: new Date("2026-04-06T10:00:00"),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(appointmentsRepository.items).toHaveLength(1);
    expect(result.value.appointment).toBe(appointmentsRepository.items[0]);
    expect(result.value.appointment.customerId.toString()).toBe(
      customer.id.toString(),
    );
    expect(result.value.appointment.establishmentId.toString()).toBe(
      establishment.id.toString(),
    );
    expect(result.value.appointment.service.serviceId.toString()).toBe(
      service.id.toString(),
    );
    expect(result.value.appointment.bookedByCustomer).toBe(true);
  });

  it("should book a service when the establishment is the author", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const customer = makeCustomer({}, new UniqueEntityId("customer-1"));
    const service = makeService({
      establishmentId: establishment.id,
    });

    await establishmentsRepository.create(establishment);
    await customersRepository.create(customer);
    await servicesRepository.create(service);

    const result = await sut.execute({
      establishmentId: establishment.id.toString(),
      customerId: customer.id.toString(),
      serviceId: service.id.toString(),
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

    expect(result.value.appointment.bookedByCustomer).toBe(false);
  });

  it("should return a conflict error when the time slot is already booked", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const customer = makeCustomer({}, new UniqueEntityId("customer-1"));
    const service = makeService({
      establishmentId: establishment.id,
    });

    await establishmentsRepository.create(establishment);
    await customersRepository.create(customer);
    await servicesRepository.create(service);

    const firstBooking = await sut.execute({
      establishmentId: establishment.id.toString(),
      customerId: customer.id.toString(),
      serviceId: service.id.toString(),
      author: {
        authorType: "CUSTOMER",
        authorId: customer.id.toString(),
      },
      startsAt: new Date("2026-04-06T10:00:00"),
    });

    expect(firstBooking.isRight()).toBe(true);

    const secondBooking = await sut.execute({
      establishmentId: establishment.id.toString(),
      customerId: customer.id.toString(),
      serviceId: service.id.toString(),
      author: {
        authorType: "CUSTOMER",
        authorId: customer.id.toString(),
      },
      startsAt: new Date("2026-04-06T10:30:00"),
    });

    if (secondBooking.isRight()) {
      throw new Error("Expected overlapping booking to fail.");
    }

    expect(appointmentsRepository.items).toHaveLength(1);
    expect(secondBooking.value).toBeInstanceOf(TimeSlotAlreadyBookedError);
  });

  it("should ignore cancelled appointments when checking for time conflicts", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const customer = makeCustomer({}, new UniqueEntityId("customer-1"));
    const service = makeService({
      establishmentId: establishment.id,
    });

    await establishmentsRepository.create(establishment);
    await customersRepository.create(customer);
    await servicesRepository.create(service);

    const firstBooking = await sut.execute({
      establishmentId: establishment.id.toString(),
      customerId: customer.id.toString(),
      serviceId: service.id.toString(),
      author: {
        authorType: "CUSTOMER",
        authorId: customer.id.toString(),
      },
      startsAt: new Date("2026-04-06T10:00:00"),
    });

    expect(firstBooking.isRight()).toBe(true);

    if (firstBooking.isLeft()) {
      throw firstBooking.value;
    }

    firstBooking.value.appointment.cancel();
    await appointmentsRepository.save(firstBooking.value.appointment);

    const secondBooking = await sut.execute({
      establishmentId: establishment.id.toString(),
      customerId: customer.id.toString(),
      serviceId: service.id.toString(),
      author: {
        authorType: "ESTABLISHMENT",
        authorId: establishment.id.toString(),
      },
      startsAt: new Date("2026-04-06T10:30:00"),
    });

    expect(secondBooking.isRight()).toBe(true);

    if (secondBooking.isLeft()) {
      throw secondBooking.value;
    }

    expect(appointmentsRepository.items).toHaveLength(2);
    expect(secondBooking.value.appointment).toBe(
      appointmentsRepository.items[1],
    );
    expect(secondBooking.value.appointment.bookedByCustomer).toBe(false);
  });
});
