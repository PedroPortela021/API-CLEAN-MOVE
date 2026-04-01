import { Either, left, right } from "../../../shared/either";
import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { UnexpectedDomainError } from "../../../shared/errors/unexpected-domain-error";
import { NotAllowed } from "../../../shared/errors/not-allowed";
import { Appointment } from "../../scheduling/domain/entities/appointment";
import { InvalidAppointmentStatusTransitionError } from "../../scheduling/domain/errors/invalid-appointment-status-transition-error";
import { AppointmentsRepository } from "../repositories/appointments-repository";
import { EstablishmentsRepository } from "../repositories/establishment-repository";
import {
  AppointmentAuthor,
  isAppointmentAuthor,
} from "../../scheduling/domain/policies/appointment-authorization";

type CancelBookServiceUseCaseRequest = {
  appointmentId: string;
  author: AppointmentAuthor;
};

type CancelBookServiceUseCaseResponse = Either<
  | ResourceNotFoundError
  | NotAllowed
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
      return left(new NotAllowed());
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
