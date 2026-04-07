import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { BookedServiceSnapshot } from "../../../scheduling/domain/value-objects/booked-service-snapshot";
import { makeAppointment } from "../../../../../tests/factories/appointment-factory";
import { makeCustomer } from "../../../../../tests/factories/customer-factory";
import { makeEstablishment } from "../../../../../tests/factories/establishment-factory";
import { InMemoryAppointmentsRepository } from "../../../../../tests/repositories/in-memory-appointments-repository";
import { InMemoryCustomersRepository } from "../../../../../tests/repositories/in-memory-customers-repository";
import { InMemoryEstablishmentsRepository } from "../../../../../tests/repositories/in-memory-establishment-repository";
import { InMemoryServicesRepository } from "../../../../../tests/repositories/in-memory-services-repository";
import { ListBookedServicesHistoryUseCase } from "./list-booked-services-history";

let appointmentsRepository: InMemoryAppointmentsRepository;
let customersRepository: InMemoryCustomersRepository;
let establishmentsRepository: InMemoryEstablishmentsRepository;

let sut: ListBookedServicesHistoryUseCase;

describe("List booked services history", () => {
  beforeEach(() => {
    const servicesRepository = new InMemoryServicesRepository();

    customersRepository = new InMemoryCustomersRepository();
    establishmentsRepository = new InMemoryEstablishmentsRepository(
      servicesRepository,
    );
    appointmentsRepository = new InMemoryAppointmentsRepository(
      establishmentsRepository,
    );

    sut = new ListBookedServicesHistoryUseCase(
      appointmentsRepository,
      customersRepository,
      establishmentsRepository,
    );
  });

  it("should return a resource not found error when the customer author does not exist", async () => {
    const result = await sut.execute({
      author: {
        authorType: "CUSTOMER",
        authorId: "customer-1",
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should return a resource not found error when the establishment author does not exist", async () => {
    const result = await sut.execute({
      author: {
        authorType: "ESTABLISHMENT",
        authorId: "est-1",
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it("should list only the customer appointment history using the provided filters", async () => {
    const customer = makeCustomer({}, new UniqueEntityId("customer-1"));
    const otherCustomer = makeCustomer({}, new UniqueEntityId("customer-2"));
    const matchingEstablishment = makeEstablishment(
      { corporateName: "Spark Wash" },
      new UniqueEntityId("est-1"),
    );
    const otherEstablishment = makeEstablishment(
      { corporateName: "Other Wash" },
      new UniqueEntityId("est-2"),
    );

    await customersRepository.create(customer);
    await customersRepository.create(otherCustomer);
    await establishmentsRepository.create(matchingEstablishment);
    await establishmentsRepository.create(otherEstablishment);

    const matchingAppointment = makeAppointment(
      {
        customerId: customer.id,
        establishmentId: matchingEstablishment.id,
        service: BookedServiceSnapshot.create({
          serviceId: new UniqueEntityId("service-1"),
          serviceName: "Lavagem premium",
          category: "WASH",
          durationInMinutes: 60,
          priceInCents: 12000,
        }),
        status: "FINISHED",
      },
      new UniqueEntityId("appointment-1"),
    );

    const wrongCategoryAppointment = makeAppointment(
      {
        customerId: customer.id,
        establishmentId: matchingEstablishment.id,
        service: BookedServiceSnapshot.create({
          serviceId: new UniqueEntityId("service-2"),
          serviceName: "Vitrificacao",
          category: "PROTECTION",
          durationInMinutes: 60,
          priceInCents: 25000,
        }),
      },
      new UniqueEntityId("appointment-2"),
    );

    const otherCustomerAppointment = makeAppointment(
      {
        customerId: otherCustomer.id,
        establishmentId: matchingEstablishment.id,
      },
      new UniqueEntityId("appointment-3"),
    );

    const otherEstablishmentAppointment = makeAppointment(
      {
        customerId: customer.id,
        establishmentId: otherEstablishment.id,
      },
      new UniqueEntityId("appointment-4"),
    );

    await appointmentsRepository.create(matchingAppointment);
    await appointmentsRepository.create(wrongCategoryAppointment);
    await appointmentsRepository.create(otherCustomerAppointment);
    await appointmentsRepository.create(otherEstablishmentAppointment);

    const result = await sut.execute({
      author: {
        authorType: "CUSTOMER",
        authorId: customer.id.toString(),
      },
      filters: {
        establishmentName: matchingEstablishment.corporateName,
        serviceName: "Lavagem premium",
        category: "WASH",
        status: "FINISHED",
        minPrice: 10000,
        maxPrice: 15000,
      },
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.appointments).toHaveLength(1);
    expect(result.value.appointments[0]?.id.toString()).toBe(
      matchingAppointment.id.toString(),
    );
  });

  it("should list only the establishment appointment history", async () => {
    const customer = makeCustomer({}, new UniqueEntityId("customer-1"));
    const establishment = makeEstablishment(
      { corporateName: "Spark Wash" },
      new UniqueEntityId("est-1"),
    );
    const otherEstablishment = makeEstablishment(
      { corporateName: "Other Wash" },
      new UniqueEntityId("est-2"),
    );

    await customersRepository.create(customer);
    await establishmentsRepository.create(establishment);
    await establishmentsRepository.create(otherEstablishment);

    const scheduledAppointment = makeAppointment(
      {
        customerId: customer.id,
        establishmentId: establishment.id,
        service: BookedServiceSnapshot.create({
          serviceId: new UniqueEntityId("service-1"),
          serviceName: "Lavagem premium",
          category: "WASH",
          durationInMinutes: 60,
          priceInCents: 12000,
        }),
        status: "SCHEDULED",
      },
      new UniqueEntityId("appointment-1"),
    );

    const finishedAppointment = makeAppointment(
      {
        customerId: customer.id,
        establishmentId: establishment.id,
        service: BookedServiceSnapshot.create({
          serviceId: new UniqueEntityId("service-2"),
          serviceName: "Cristalizacao",
          category: "PROTECTION",
          durationInMinutes: 60,
          priceInCents: 18000,
        }),
        status: "FINISHED",
      },
      new UniqueEntityId("appointment-2"),
    );

    const otherEstablishmentAppointment = makeAppointment(
      {
        customerId: customer.id,
        establishmentId: otherEstablishment.id,
      },
      new UniqueEntityId("appointment-3"),
    );

    await appointmentsRepository.create(scheduledAppointment);
    await appointmentsRepository.create(finishedAppointment);
    await appointmentsRepository.create(otherEstablishmentAppointment);

    const result = await sut.execute({
      author: {
        authorType: "ESTABLISHMENT",
        authorId: establishment.id.toString(),
      },
      filters: {
        status: "SCHEDULED",
        category: "WASH",
        maxPrice: 15000,
      },
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.appointments).toHaveLength(1);
    expect(result.value.appointments[0]?.id.toString()).toBe(
      scheduledAppointment.id.toString(),
    );
  });
});
