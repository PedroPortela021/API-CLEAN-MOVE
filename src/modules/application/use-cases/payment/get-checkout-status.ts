import { Either, left, right } from "../../../../shared/either";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { Payment } from "../../../payment/entities/payment";
import { Appointment } from "../../../scheduling/domain/entities/appointment";
import { AppointmentsRepository } from "../../repositories/appointments-repository";
import { PaymentsRepository } from "../../repositories/payments-repository";

export type CheckoutStatus = "PENDING" | "PAID" | "EXPIRED";

type GetCheckoutStatusUseCaseRequest = {
  paymentId: string;
};

type GetCheckoutStatusUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    payment: Payment;
    appointment: Appointment;
    status: CheckoutStatus;
  }
>;

export class GetCheckoutStatusUseCase {
  constructor(
    private paymentsRepository: PaymentsRepository,
    private appointmentsRepository: AppointmentsRepository,
  ) {}

  async execute({
    paymentId,
  }: GetCheckoutStatusUseCaseRequest): Promise<GetCheckoutStatusUseCaseResponse> {
    const payment = await this.paymentsRepository.findById(paymentId);

    if (!payment) {
      return left(new ResourceNotFoundError({ resource: "payment" }));
    }

    const appointment = await this.appointmentsRepository.findById(
      payment.appointmentId.toString(),
    );

    if (!appointment) {
      return left(new ResourceNotFoundError({ resource: "appointment" }));
    }

    return right({
      payment,
      appointment,
      status: this.resolveStatus(payment, appointment),
    });
  }

  private resolveStatus(
    payment: Payment,
    appointment: Appointment,
  ): CheckoutStatus {
    if (payment.status === "PAID" || appointment.status === "SCHEDULED") {
      return "PAID";
    }

    if (
      payment.status === "EXPIRED" ||
      payment.status === "CANCELLED" ||
      appointment.status === "EXPIRED" ||
      appointment.status === "CANCELLED"
    ) {
      return "EXPIRED";
    }

    return "PENDING";
  }
}
