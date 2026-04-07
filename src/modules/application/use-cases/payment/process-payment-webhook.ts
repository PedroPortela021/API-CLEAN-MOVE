import { Either, left, right } from "../../../../shared/either";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { UnexpectedDomainError } from "../../../../shared/errors/unexpected-domain-error";
import { Payment } from "../../../payment/entities/payment";
import { InvalidPaymentStatusTransitionError } from "../../../payment/errors/invalid-payment-status-transition-error";
import { Appointment } from "../../../scheduling/domain/entities/appointment";
import { InvalidAppointmentStatusTransitionError } from "../../../scheduling/domain/errors/invalid-appointment-status-transition-error";
import { AppointmentsRepository } from "../../repositories/appointments-repository";
import { PaymentsRepository } from "../../repositories/payments-repository";
import { UnitOfWork } from "../../repositories/unit-of-work";

type ProcessPaymentWebhookUseCaseRequest = {
  providerName: string;
  providerPaymentId: string;
  paidAt?: Date;
};

type ProcessPaymentWebhookUseCaseResponse = Either<
  | ResourceNotFoundError
  | InvalidPaymentStatusTransitionError
  | InvalidAppointmentStatusTransitionError
  | UnexpectedDomainError,
  {
    payment: Payment;
    appointment: Appointment;
    alreadyProcessed: boolean;
  }
>;

export class ProcessPaymentWebhookUseCase {
  constructor(
    private paymentsRepository: PaymentsRepository,
    private appointmentsRepository: AppointmentsRepository,
    private unitOfWork: UnitOfWork,
  ) {}

  async execute({
    providerName,
    providerPaymentId,
    paidAt,
  }: ProcessPaymentWebhookUseCaseRequest): Promise<ProcessPaymentWebhookUseCaseResponse> {
    const referenceDate = paidAt ?? new Date();

    if (Number.isNaN(referenceDate.getTime())) {
      return left(new UnexpectedDomainError());
    }

    const payment =
      await this.paymentsRepository.findByProviderNameAndPaymentId(
        providerName.trim(),
        providerPaymentId.trim(),
      );

    if (!payment) {
      return left(new ResourceNotFoundError({ resource: "payment" }));
    }

    const appointment = await this.appointmentsRepository.findById(
      payment.appointmentId.toString(),
    );

    if (!appointment) {
      return left(new ResourceNotFoundError({ resource: "appointment" }));
    }

    const alreadyProcessed =
      payment.status === "PAID" && appointment.status === "SCHEDULED";

    if (alreadyProcessed) {
      return right({
        payment,
        appointment,
        alreadyProcessed: true,
      });
    }

    try {
      await this.unitOfWork.execute(async () => {
        let shouldSavePayment = false;
        let shouldSaveAppointment = false;

        if (payment.status !== "PAID") {
          payment.markAsPaid(referenceDate);
          shouldSavePayment = true;
        }

        if (appointment.status === "AWAITING_PAYMENT") {
          appointment.confirmPayment(referenceDate);
          shouldSaveAppointment = true;
        } else if (appointment.status !== "SCHEDULED") {
          throw new InvalidAppointmentStatusTransitionError(
            "Only appointments awaiting payment or already scheduled can confirm payment.",
          );
        }

        if (shouldSavePayment) {
          await this.paymentsRepository.save(payment);
        }

        if (shouldSaveAppointment) {
          await this.appointmentsRepository.save(appointment);
        }
      });
    } catch (error) {
      if (error instanceof InvalidPaymentStatusTransitionError) {
        return left(new InvalidPaymentStatusTransitionError(error.message));
      }

      if (error instanceof InvalidAppointmentStatusTransitionError) {
        return left(new InvalidAppointmentStatusTransitionError(error.message));
      }

      return left(new UnexpectedDomainError());
    }

    return right({
      payment,
      appointment,
      alreadyProcessed: false,
    });
  }
}
