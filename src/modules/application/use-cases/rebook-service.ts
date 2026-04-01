import { Either, left, right } from "../../../shared/either";
import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { UnexpectedDomainError } from "../../../shared/errors/unexpected-domain-error";
import { EstablishmentClosedError } from "../../establishments/domain/errors/establishment-closed-error";
import { Appointment } from "../../scheduling/domain/entities/appointment";
import { InvalidAppointmentStatusTransitionError } from "../../scheduling/domain/errors/invalid-appointment-status-transition-error";
import { InvalidBookServiceInputError } from "../../scheduling/domain/errors/invalid-book-service-input-error";
import { TimeSlotAlreadyBookedError } from "../../scheduling/domain/errors/time-slot-already-booked-error";

import {
  InvalidTimeSlotError,
  TimeSlot,
} from "../../scheduling/domain/value-objects/time-slot";
import { AppointmentsRepository } from "../repositories/appointments-repository";
import { EstablishmentsRepository } from "../repositories/establishment-repository";

type RebookServiceUseCaseRequest = {
  appointmentId: string;
  startsAt: Date;
};

type RebookServiceUseCaseResponse = Either<
  | ResourceNotFoundError
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
    startsAt,
  }: RebookServiceUseCaseRequest): Promise<RebookServiceUseCaseResponse> {
    const appointment =
      await this.appointmentsRepository.findById(appointmentId);

    if (!appointment) {
      return left(new ResourceNotFoundError({ resource: "appointment" }));
    }

    const establishment = await this.establishmentsRepository.findById(
      appointment.establishmentId.toString(),
    );

    if (!establishment) {
      return left(new ResourceNotFoundError({ resource: "establishment" }));
    }

    let slot: TimeSlot;
    let endsAt: Date;

    try {
      endsAt = new Date(
        startsAt.getTime() + appointment.service.durationInMinutes * 60 * 1000,
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

    const overlapedAppointments =
      await this.appointmentsRepository.findManyByEstablishmentIdAndInterval(
        establishment.id.toString(),
        startsAt,
        endsAt,
      );

    let isOverlapedAppointment = false;

    if (overlapedAppointments) {
      isOverlapedAppointment = overlapedAppointments.some(
        (appointment) =>
          appointment.status !== "CANCELLED" &&
          appointment.id.toString() !== appointmentId,
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
