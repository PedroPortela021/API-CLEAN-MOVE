import { DomainEvents } from "../../../../shared/events/domain-events";
import { Payment } from "../../../payment/domain/entities/payment";
import { PaymentsRepository } from "../../repositories/payments-repository";
import { AppointmentCancelledEvent } from "../../../scheduling/domain/events/appointment-cancelled-event";

export class OnAppointmentCancelledSubscriber {
  constructor(private paymentsRepository: PaymentsRepository) {
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    DomainEvents.register(
      this.handle.bind(this),
      AppointmentCancelledEvent.name,
    );
  }

  private async handle(event: AppointmentCancelledEvent) {
    const payments = await this.paymentsRepository.findManyByAppointmentId(
      event.appointmentId.toString(),
    );

    for (const payment of payments) {
      if (!this.canCancelPayment(payment)) {
        continue;
      }

      payment.cancel(event.cancelledAt);
      await this.paymentsRepository.save(payment);
    }
  }

  private canCancelPayment(payment: Payment) {
    return payment.status === "INITIATED" || payment.status === "PENDING";
  }
}
