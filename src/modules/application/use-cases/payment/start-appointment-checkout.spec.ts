import { NotAllowedError } from "../../../../shared/errors/not-allowed-error";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { UnexpectedDomainError } from "../../../../shared/errors/unexpected-domain-error";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { makeCustomer } from "../../../../../tests/factories/customer-factory";
import { makeEstablishment } from "../../../../../tests/factories/establishment-factory";
import { makeService } from "../../../../../tests/factories/service-factory";
import { FakePaymentGateway } from "../../../../../tests/repositories/fake-payment-gateway";
import { InMemoryAppointmentsRepository } from "../../../../../tests/repositories/in-memory-appointments-repository";
import { InMemoryCustomersRepository } from "../../../../../tests/repositories/in-memory-customers-repository";
import { InMemoryEstablishmentsRepository } from "../../../../../tests/repositories/in-memory-establishment-repository";
import { InMemoryPaymentsRepository } from "../../../../../tests/repositories/in-memory-payments-repository";
import { InMemoryServicesRepository } from "../../../../../tests/repositories/in-memory-services-repository";
import { AppointmentBookingService } from "../../services/appointment-booking-service";
import { StartAppointmentCheckoutUseCase } from "./start-appointment-checkout";

let appointmentsRepository: InMemoryAppointmentsRepository;
let customersRepository: InMemoryCustomersRepository;
let establishmentsRepository: InMemoryEstablishmentsRepository;
let servicesRepository: InMemoryServicesRepository;
let paymentsRepository: InMemoryPaymentsRepository;
let paymentGateway: FakePaymentGateway;
let appointmentBookingService: AppointmentBookingService;

let sut: StartAppointmentCheckoutUseCase;

describe("Start appointment checkout", () => {
  beforeEach(() => {
    appointmentsRepository = new InMemoryAppointmentsRepository();
    customersRepository = new InMemoryCustomersRepository();
    servicesRepository = new InMemoryServicesRepository();
    establishmentsRepository = new InMemoryEstablishmentsRepository(
      servicesRepository,
    );
    paymentsRepository = new InMemoryPaymentsRepository();
    paymentGateway = new FakePaymentGateway();
    appointmentBookingService = new AppointmentBookingService(
      appointmentsRepository,
      establishmentsRepository,
      customersRepository,
      servicesRepository,
    );

    sut = new StartAppointmentCheckoutUseCase(
      appointmentBookingService,
      appointmentsRepository,
      paymentsRepository,
      paymentGateway,
    );
  });

  it("should start the checkout by creating an appointment awaiting payment and a pending Pix payment", async () => {
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
    expect(paymentsRepository.items).toHaveLength(1);
    expect(result.value.appointment.status).toBe("AWAITING_PAYMENT");
    expect(result.value.appointment.reservationExpiresAt).toBeInstanceOf(Date);
    expect(result.value.payment.status).toBe("PENDING");
    expect(result.value.payment.appointmentId.toString()).toBe(
      result.value.appointment.id.toString(),
    );
    expect(result.value.payment.amountInCents).toBe(
      result.value.appointment.service.priceInCents,
    );
    expect(result.value.payment.providerPaymentId).toBe("pix-payment-1");
    expect(paymentGateway.createPixPaymentCalls).toHaveLength(1);
    expect(paymentGateway.createPixPaymentCalls[0]?.paymentId).toBe(
      result.value.payment.id.toString(),
    );
  });

  it("should return the booking error and skip payment creation when the appointment cannot be booked", async () => {
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
    expect(appointmentsRepository.items).toHaveLength(0);
    expect(paymentsRepository.items).toHaveLength(0);
    expect(paymentGateway.createPixPaymentCalls).toHaveLength(0);
  });

  it("should return a resource not found error when the customer does not exist", async () => {
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
      startsAt: new Date("2026-04-06T10:00:00"),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(paymentsRepository.items).toHaveLength(0);
  });

  it("should rollback the appointment and payment when the Pix gateway fails", async () => {
    const establishment = makeEstablishment({}, new UniqueEntityId("est-1"));
    const customer = makeCustomer({}, new UniqueEntityId("customer-1"));
    const service = makeService({
      establishmentId: establishment.id,
    });

    paymentGateway.shouldFail = true;

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

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UnexpectedDomainError);
    expect(appointmentsRepository.items).toHaveLength(1);
    expect(appointmentsRepository.items[0]?.status).toBe("CANCELLED");
    expect(paymentsRepository.items).toHaveLength(1);
    expect(paymentsRepository.items[0]?.status).toBe("CANCELLED");
  });
});
