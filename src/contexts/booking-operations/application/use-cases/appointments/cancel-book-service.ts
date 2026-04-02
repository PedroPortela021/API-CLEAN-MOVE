import { Either, left, right } from "../../../../../shared/either";
import { ResourceNotFoundError } from "../../../../../shared/errors/resource-not-found-error";
import { UnexpectedDomainError } from "../../../../../shared/errors/unexpected-domain-error";
import { NotAllowedError } from "../../../../../shared/errors/not-allowed-error";
import { Appointment } from "../../../domain/scheduling/entities/appointment";
import { InvalidAppointmentStatusTransitionError } from "../../../domain/scheduling/errors/invalid-appointment-status-transition-error";
import { AppointmentsRepository } from "../../repositories/appointments-repository";
import { EstablishmentsRepository } from "../../repositories/establishment-repository";
import {
  AppointmentAuthor,
  isAppointmentAuthor,
} from "../../../domain/scheduling/policies/appointment-authorization";

type CancelBookServiceUseCaseRequest = {
  appointmentId: string;
  author: AppointmentAuthor;
};

type CancelBookServiceUseCaseResponse = Either<
  | ResourceNotFoundError
  | NotAllowedError
  | InvalidAppointmentStatusTransitionError
  | UnexpectedDomainError,
  {
    appointment: Appointment;
  }
>;

export class CancelBookServiceUseCase {
  constructor(
    private appointmentsRepository: AppointmentsRepository,
    private establishmentsRepository: EstablishmentsRepository,
  ) {}

  async execute({
    appointmentId,
    author,
  }: CancelBookServiceUseCaseRequest): Promise<CancelBookServiceUseCaseResponse> {
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

    if (!isAppointmentAuthor(appointment, author)) {
      return left(new NotAllowedError());
    }

    try {
      appointment.cancel();
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
