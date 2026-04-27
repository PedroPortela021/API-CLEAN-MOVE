import { Either, left, right } from "../../../../shared/either";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { UnexpectedDomainError } from "../../../../shared/errors/unexpected-domain-error";
import { NotAllowedError } from "../../../../shared/errors/not-allowed-error";
import { EstablishmentClosedError } from "../../../establishments/domain/errors/establishment-closed-error";
import { Appointment } from "../../../scheduling/domain/entities/appointment";
import { InvalidAppointmentStatusTransitionError } from "../../../scheduling/domain/errors/invalid-appointment-status-transition-error";
import { InvalidBookServiceInputError } from "../../../scheduling/domain/errors/invalid-book-service-input-error";
import { TimeSlotAlreadyBookedError } from "../../../scheduling/domain/errors/time-slot-already-booked-error";

import {
  InvalidTimeSlotError,
  TimeSlot,
} from "../../../scheduling/domain/value-objects/time-slot";
import { AppointmentsRepository } from "../../repositories/appointments-repository";
import { EstablishmentsRepository } from "../../repositories/establishment-repository";
import {
  AppointmentAuthor,
  isAppointmentAuthor,
} from "../../../scheduling/domain/policies/appointment-authorization";

type RebookServiceUseCaseRequest = {
  appointmentId: string;
  author: AppointmentAuthor;
  startsAt: Date;
};

type RebookServiceUseCaseResponse = Either<
  | ResourceNotFoundError
  | NotAllowedError
  | EstablishmentClosedError
  | TimeSlotAlreadyBookedError
  | InvalidBookServiceInputError
  | UnexpectedDomainError,
  {
    appointment: Appointment;
  }
>;

export class RebookServiceUseCase {
  constructor(
    private appointmentsRepository: AppointmentsRepository,
    private establishmentsRepository: EstablishmentsRepository,
  ) {}

  async execute({
    appointmentId,
    author,
    startsAt,
  }: RebookServiceUseCaseRequest): Promise<RebookServiceUseCaseResponse> {
    const appointment =
      await this.appointmentsRepository.findById(appointmentId);

    if (!appointment) {
      return left(new ResourceNotFoundError({ resource: "appointment" }));
    }

    if (!isAppointmentAuthor(appointment, author)) {
      return left(new NotAllowedError());
    }

    let slot: TimeSlot;
    let endsAt: Date;
    const durationInMinutes =
      appointment.service.durationInMinutes ??
      appointment.slot.durationInMinutes;

    try {
      endsAt = new Date(startsAt.getTime() + durationInMinutes * 60 * 1000);

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

    const establishment = await this.establishmentsRepository.findById(
      appointment.establishmentId.toString(),
    );

    if (!establishment) {
      return left(new ResourceNotFoundError({ resource: "establishment" }));
    }

    const isEstablishmentOpen = establishment.isOpenDuring(startsAt, endsAt);

    if (!isEstablishmentOpen) {
      return left(new EstablishmentClosedError());
    }

    const overlapedAppointments =
      await this.appointmentsRepository.findManyByEstablishmentIdAndInterval(
        appointment.establishmentId.toString(),
        startsAt,
        endsAt,
      );

    let isOverlapedAppointment = false;
    const now = new Date();

    if (overlapedAppointments) {
      isOverlapedAppointment = overlapedAppointments.some(
        (overlappedAppointment) =>
          overlappedAppointment.id.toString() !== appointmentId &&
          overlappedAppointment.blocksTimeSlot(now),
      );
    }

    if (isOverlapedAppointment) {
      return left(new TimeSlotAlreadyBookedError());
    }

    let updatedAppointment;
    try {
      appointment.reschedule(slot);
      updatedAppointment = appointment;
    } catch (error) {
      if (error instanceof InvalidAppointmentStatusTransitionError) {
        return left(new InvalidBookServiceInputError(error.message));
      }
      return left(new UnexpectedDomainError());
    }

    await this.appointmentsRepository.save(updatedAppointment);

    return right({
      appointment: updatedAppointment,
    });
  }
}
