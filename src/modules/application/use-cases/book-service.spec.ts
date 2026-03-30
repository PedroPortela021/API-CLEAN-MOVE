import { InactiveServiceError } from "../../catalog/domain/errors/inactive-service-error";
import { EstimatedDuration } from "../../catalog/domain/value-objects/estimated-duration";
import { EstablishmentClosedError } from "../../establishments/domain/errors/establishment-closed-error";
import { OperatingHours } from "../../establishments/domain/value-objects/operating-hours";
import { TimeSlotAlreadyBookedError } from "../../scheduling/domain/errors/time-slot-already-booked-error";
import { UniqueEntityId } from "../../../shared/entities/unique-entity-id";
import { makeCustomer } from "../../../tests/factories/customer-factory";
import { makeEstablishment } from "../../../tests/factories/establishment-factory";
import { makeService } from "../../../tests/factories/service-factory";
import { InMemoryAppointmentsRepository } from "../../../tests/repositories/in-memory-appointments-repository";
import { InMemoryCustomersRepository } from "../../../tests/repositories/in-memory-customers-repository";
import { InMemoryEstablishmentsRepository } from "../../../tests/repositories/in-memory-establishment-repository";
import { InMemoryServicesRepository } from "../../../tests/repositories/in-memory-services-repository";
import { BookServiceUseCase } from "./book-service";

class TrackingCustomersRepository extends InMemoryCustomersRepository {
  public findByIdCalls = 0;

  async findById(id: string) {
    this.findByIdCalls += 1;
    return super.findById(id);
  }
}

class TrackingAppointmentsRepository extends InMemoryAppointmentsRepository {
  public intervalLookupCalls = 0;

  async findManyByEstablishmentIdAndInterval(
    establishmentId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    this.intervalLookupCalls += 1;
    return super.findManyByEstablishmentIdAndInterval(
      establishmentId,
      startsAt,
      endsAt,
    );
  }
}

let appointmentsRepository: TrackingAppointmentsRepository;
let establishmentsRepository: InMemoryEstablishmentsRepository;
let customersRepository: TrackingCustomersRepository;
let servicesRepository: InMemoryServicesRepository;

let sut: BookServiceUseCase;

describe("Book service", () => {
  beforeEach(() => {
    appointmentsRepository = new TrackingAppointmentsRepository();
    establishmentsRepository = new InMemoryEstablishmentsRepository();
    customersRepository = new TrackingCustomersRepository();
    servicesRepository = new InMemoryServicesRepository();

    sut = new BookServiceUseCase(
      appointmentsRepository,
      establishmentsRepository,
      customersRepository,
      servicesRepository,
    );
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
      bookedByCustomer: true,
      startsAt: new Date("2026-04-06T10:00:00"),
    });

    if (result.isRight()) {
      throw new Error("Expected inactive service error.");
    }

    expect(result.value).toBeInstanceOf(InactiveServiceError);
    expect(customersRepository.findByIdCalls).toBe(0);
    expect(appointmentsRepository.intervalLookupCalls).toBe(0);
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
      bookedByCustomer: true,
      startsAt: new Date("2026-04-06T19:00:00"),
    });

    if (result.isRight()) {
      throw new Error("Expected establishment closed error.");
    }

    expect(result.value).toBeInstanceOf(EstablishmentClosedError);
    expect(customersRepository.findByIdCalls).toBe(0);
    expect(appointmentsRepository.intervalLookupCalls).toBe(0);
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
      bookedByCustomer: true,
      startsAt: new Date("2026-04-06T23:30:00"),
    });

    if (result.isRight()) {
      throw new Error(
        "Expected establishment closed error for overnight slot.",
      );
    }

    expect(result.value).toBeInstanceOf(EstablishmentClosedError);
    expect(customersRepository.findByIdCalls).toBe(0);
    expect(appointmentsRepository.intervalLookupCalls).toBe(0);
  });

  it("should book a service when the request is valid", async () => {
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
      bookedByCustomer: true,
      startsAt: new Date("2026-04-06T10:00:00"),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.appointment).toBe(appointmentsRepository.items[0]);
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
      bookedByCustomer: true,
      startsAt: new Date("2026-04-06T10:00:00"),
    });

    expect(firstBooking.isRight()).toBe(true);

    const secondBooking = await sut.execute({
      establishmentId: establishment.id.toString(),
      customerId: customer.id.toString(),
      serviceId: service.id.toString(),
      bookedByCustomer: true,
      startsAt: new Date("2026-04-06T10:30:00"),
    });

    if (secondBooking.isRight()) {
      throw new Error("Expected overlapping booking to fail.");
    }

    expect(secondBooking.value).toBeInstanceOf(TimeSlotAlreadyBookedError);
  });
});
