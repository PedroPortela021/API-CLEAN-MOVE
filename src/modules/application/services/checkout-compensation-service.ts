import { Payment } from "../../payment/domain/entities/payment";
import {
  CheckoutRecovery,
  CheckoutRecoveryReason,
} from "../../payment/domain/entities/checkout-recovery";
import { Appointment } from "../../scheduling/domain/entities/appointment";
import { AppointmentsRepository } from "../repositories/appointments-repository";
import { CheckoutRecoveriesRepository } from "../repositories/checkout-recoveries-repository";
import { PaymentsRepository } from "../repositories/payments-repository";
import { UnitOfWork } from "../repositories/unit-of-work";

type CheckoutCompensationServiceRequest = {
  appointment: Appointment;
  payment?: Payment | null;
  reason: CheckoutRecoveryReason;
  cause: unknown;
  referenceDate?: Date;
};

type CheckoutCompensationServiceResponse = {
  recovery: CheckoutRecovery | null;
};

export class CheckoutCompensationService {
  constructor(
    private appointmentsRepository: AppointmentsRepository,
    private paymentsRepository: PaymentsRepository,
    private checkoutRecoveriesRepository: CheckoutRecoveriesRepository,
    private unitOfWork: UnitOfWork,
  ) {}

  async execute({
    appointment,
    payment,
    reason,
    cause,
    referenceDate = new Date(),
  }: CheckoutCompensationServiceRequest): Promise<CheckoutCompensationServiceResponse> {
    return this.unitOfWork.execute(async () => {
      let appointmentCompensationPending = false;
      let paymentCompensationPending = false;

      const failureMessages = [this.normalizeErrorMessage("cause", cause)];

      if (this.requiresAppointmentCompensation(appointment)) {
        try {
          appointment.cancel();
          await this.appointmentsRepository.save(appointment);
        } catch (error) {
          appointmentCompensationPending = true;
          failureMessages.push(
            this.normalizeErrorMessage("appointment compensation", error),
          );
        }
      }

      if (payment && this.requiresPaymentCompensation(payment)) {
        try {
          payment.cancel(referenceDate);
          await this.paymentsRepository.save(payment);
        } catch (error) {
          paymentCompensationPending = true;
          failureMessages.push(
            this.normalizeErrorMessage("payment compensation", error),
          );
        }
      }

      if (!appointmentCompensationPending && !paymentCompensationPending) {
        return { recovery: null };
      }

      const recovery = CheckoutRecovery.create({
        appointmentId: appointment.id,
        paymentId: payment?.id ?? null,
        reason,
        appointmentCompensationPending,
        paymentCompensationPending,
        failureMessage: failureMessages.join(" | "),
      });

      await this.checkoutRecoveriesRepository.create(recovery);

      return { recovery };
    });
  }

  private requiresAppointmentCompensation(appointment: Appointment) {
    return (
      appointment.status !== "CANCELLED" && appointment.status !== "EXPIRED"
    );
  }

  private requiresPaymentCompensation(payment: Payment) {
    return payment.status !== "CANCELLED" && payment.status !== "EXPIRED";
  }

  private normalizeErrorMessage(context: string, error: unknown) {
    if (error instanceof Error) {
      return `${context}: ${error.message}`;
    }

    return `${context}: Unknown error`;
  }
}
