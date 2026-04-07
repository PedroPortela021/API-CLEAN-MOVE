import { Either, left, right } from "../../../../shared/either";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { UnexpectedDomainError } from "../../../../shared/errors/unexpected-domain-error";
import { Payment } from "../../../payment/entities/payment";
import { InvalidPaymentStatusTransitionError } from "../../../payment/errors/invalid-payment-status-transition-error";
import { InvalidAppointmentStatusTransitionError } from "../../../scheduling/domain/errors/invalid-appointment-status-transition-error";
import { AppointmentsRepository } from "../../repositories/appointments-repository";
import { PaymentsRepository } from "../../repositories/payments-repository";
import { UnitOfWork } from "../../repositories/unit-of-work";

type ExpirePendingPixPaymentsUseCaseRequest = {
  referenceDate?: Date;
};

type ExpirePendingPixPaymentsUseCaseResponse = Either<
  | ResourceNotFoundError
  | InvalidPaymentStatusTransitionError
  | InvalidAppointmentStatusTransitionError
  | UnexpectedDomainError,
  {
    expiredPayments: Payment[];
  }
>;

export class ExpirePendingPixPaymentsUseCase {
  constructor(
    private paymentsRepository: PaymentsRepository,
    private appointmentsRepository: AppointmentsRepository,
    private unitOfWork: UnitOfWork,
  ) {}

  async execute({
    referenceDate,
  }: ExpirePendingPixPaymentsUseCaseRequest = {}): Promise<ExpirePendingPixPaymentsUseCaseResponse> {
    const executionDate = referenceDate ?? new Date();

    if (Number.isNaN(executionDate.getTime())) {
      return left(new UnexpectedDomainError());
    }

    const pendingPayments = await this.paymentsRepository.findManyPending();
    const expiredPayments: Payment[] = [];

    for (const payment of pendingPayments) {
      if (!payment.isPixExpired(executionDate)) {
        continue;
      }

      const appointment = await this.appointmentsRepository.findById(
        payment.appointmentId.toString(),
      );

      if (!appointment) {
        return left(new ResourceNotFoundError({ resource: "appointment" }));
      }

      try {
        await this.unitOfWork.execute(async () => {
          payment.expire(executionDate);
          appointment.expirePayment(executionDate);

          await this.paymentsRepository.save(payment);
          await this.appointmentsRepository.save(appointment);
        });
      } catch (error) {
        if (error instanceof InvalidPaymentStatusTransitionError) {
          return left(new InvalidPaymentStatusTransitionError(error.message));
        }

        if (error instanceof InvalidAppointmentStatusTransitionError) {
          return left(
            new InvalidAppointmentStatusTransitionError(error.message),
          );
        }

        return left(new UnexpectedDomainError());
      }

      expiredPayments.push(payment);
    }

    return right({
      expiredPayments,
    });
  }
}
