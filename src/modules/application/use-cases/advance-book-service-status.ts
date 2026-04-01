import { Either, left, right } from "../../../shared/either";
import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { UnexpectedDomainError } from "../../../shared/errors/unexpected-domain-error";
import { NotAllowedError } from "../../../shared/errors/not-allowed-error";
import { Appointment } from "../../scheduling/domain/entities/appointment";
import { InvalidAppointmentStatusTransitionError } from "../../scheduling/domain/errors/invalid-appointment-status-transition-error";
import { AppointmentsRepository } from "../repositories/appointments-repository";
import { EstablishmentsRepository } from "../repositories/establishment-repository";
import {
  AppointmentAuthor,
  canAdvanceAppointmentStatus,
} from "../../scheduling/domain/policies/appointment-authorization";

type AdvanceBookServiceStatusUseCaseRequest = {
  appointmentId: string;
  author: AppointmentAuthor;
};

type AdvanceBookServiceStatusUseCaseResponse = Either<
  | ResourceNotFoundError
  | NotAllowedError
  | InvalidAppointmentStatusTransitionError
  | UnexpectedDomainError,
  {
    appointment: Appointment;
  }
>;

export class AdvanceBookServiceStatusUseCase {
  constructor(
    private appointmentsRepository: AppointmentsRepository,
    private establishmentsRepository: EstablishmentsRepository,
  ) {}

  async execute({
    appointmentId,
    author,
  }: AdvanceBookServiceStatusUseCaseRequest): Promise<AdvanceBookServiceStatusUseCaseResponse> {
    const appointment =
      await this.appointmentsRepository.findById(appointmentId);

    if (!appointment) {
      return left(new ResourceNotFoundError({ resource: "appointment" }));
    }

    if (!canAdvanceAppointmentStatus({ appointment, author })) {
      return left(new NotAllowedError());
    }

    const establishment = await this.establishmentsRepository.findById(
      appointment.establishmentId.toString(),
    );

    if (!establishment) {
      return left(new ResourceNotFoundError({ resource: "establishment" }));
    }

    try {
      appointment.advanceStatus();
    } catch (error) {
      if (error instanceof InvalidAppointmentStatusTransitionError) {
        return left(new InvalidAppointmentStatusTransitionError(error.message));
      }
      return left(new UnexpectedDomainError());
    }

    await this.appointmentsRepository.save(appointment);

    return right({
      appointment,
    });
  }
}
