import { Either, left, right } from "../../../shared/either";
import { UniqueEntityId } from "../../../shared/entities/unique-entity-id";
import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { UnexpectedDomainError } from "../../../shared/errors/unexpected-domain-error";
import { NotAllowed } from "../../../shared/errors/not-allowed";
import { InactiveServiceError } from "../../catalog/domain/errors/inactive-service-error";
import { EstablishmentClosedError } from "../../establishments/domain/errors/establishment-closed-error";
import { Appointment } from "../../scheduling/domain/entities/appointment";
import { InvalidBookServiceInputError } from "../../scheduling/domain/errors/invalid-book-service-input-error";
import { TimeSlotAlreadyBookedError } from "../../scheduling/domain/errors/time-slot-already-booked-error";
import {
  AppointmentAuthor,
  canBookAppointment,
} from "../../scheduling/domain/policies/appointment-authorization";
import {
  BookedServiceSnapshot,
  InvalidBookedServiceSnapshotError,
} from "../../scheduling/domain/value-objects/booked-service-snapshot";
import {
  InvalidTimeSlotError,
  TimeSlot,
} from "../../scheduling/domain/value-objects/time-slot";
import { AppointmentsRepository } from "../repositories/appointments-repository";
import { CustomersRepository } from "../repositories/customers-repository";
import { EstablishmentsRepository } from "../repositories/establishment-repository";
import { ServicesRepository } from "../repositories/services-repository";

type BookServiceUseCaseRequest = {
  establishmentId: string;
  customerId: string;
  serviceId: string;
  author: AppointmentAuthor;
  startsAt: Date;
};

type BookServiceUseCaseResponse = Either<
  | ResourceNotFoundError
  | NotAllowed
  | InactiveServiceError
  | EstablishmentClosedError
  | TimeSlotAlreadyBookedError
  | InvalidBookServiceInputError
  | UnexpectedDomainError,
  {
    appointment: Appointment;
  }
>;

export class BookServiceUseCase {
  constructor(
    private appointmentsRepository: AppointmentsRepository,
    private establishmentsRepository: EstablishmentsRepository,
    private customersRepository: CustomersRepository,
    private servicesRepository: ServicesRepository,
  ) {}

  async execute({
    establishmentId,
    customerId,
    serviceId,
    author,
    startsAt,
  }: BookServiceUseCaseRequest): Promise<BookServiceUseCaseResponse> {
    if (
      !canBookAppointment({
        author,
        customerId,
        establishmentId,
      })
    ) {
      return left(new NotAllowed());
    }

    const establishment =
      await this.establishmentsRepository.findById(establishmentId);

    if (!establishment) {
      return left(new ResourceNotFoundError({ resource: "establishment" }));
    }

    const service =
      await this.servicesRepository.findByServiceIdAndEstablishmentId(
        serviceId,
        establishmentId,
      );

    if (!service) {
      return left(new ResourceNotFoundError({ resource: "service" }));
    }

    if (!service.isActive) {
      return left(new InactiveServiceError(service.serviceName.value));
    }

    let slot: TimeSlot;
    let endsAt: Date;

    try {
      endsAt = new Date(
        startsAt.getTime() + service.estimatedDuration.maxInMinutes * 60 * 1000,
      );

      slot = TimeSlot.create({
        startsAt,
        endsAt,
      });
    } catch (error) {
      if (error instanceof InvalidTimeSlotError) {
        return left(new InvalidBookServiceInputError(error.message));
      }
      return left(new UnexpectedDomainError());
    }

    const isEstablishmentOpen = establishment.isOpenDuring(startsAt, endsAt);

    if (!isEstablishmentOpen) {
      return left(new EstablishmentClosedError());
    }

    const customer = await this.customersRepository.findById(customerId);

    if (!customer) {
      return left(new ResourceNotFoundError({ resource: "customer" }));
    }

    const overlapedAppointments =
      await this.appointmentsRepository.findManyByEstablishmentIdAndInterval(
        establishmentId,
        startsAt,
        endsAt,
      );

    let isOverlapedAppointment = false;

    if (overlapedAppointments) {
      isOverlapedAppointment = overlapedAppointments.some(
        (appointment) => appointment.status !== "CANCELLED",
      );
    }

    if (isOverlapedAppointment) {
      return left(new TimeSlotAlreadyBookedError());
    }

    let appointment;
    const bookedByCustomer = author.authorType === "CUSTOMER";

    try {
      appointment = Appointment.create({
        customerId: new UniqueEntityId(customerId),
        establishmentId: new UniqueEntityId(establishmentId),
        service: BookedServiceSnapshot.create({
          durationInMinutes: service.estimatedDuration.maxInMinutes,
          priceInCents: service.price.amountInCents,
          serviceId: service.id,
          serviceName: service.serviceName.value,
        }),
        bookedByCustomer,
        slot,
      });
    } catch (error) {
      if (
        error instanceof InvalidBookedServiceSnapshotError ||
        error instanceof InvalidTimeSlotError
      ) {
        return left(new InvalidBookServiceInputError(error.message));
      }
      return left(new UnexpectedDomainError());
    }

    await this.appointmentsRepository.create(appointment);

    return right({
      appointment,
    });
  }
}
