import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { DomainEvents } from "../../../../shared/events/domain-events";
import { PaymentPaidEvent } from "../../../payment/domain/events/payment-paid-event";
import { InvalidAppointmentStatusTransitionError } from "../../../scheduling/domain/errors/invalid-appointment-status-transition-error";
import { AppointmentsRepository } from "../../repositories/appointments-repository";

export class OnPaymentPaidSubscriber {
  constructor(private appointmentsRepository: AppointmentsRepository) {
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    DomainEvents.register(this.handle.bind(this), PaymentPaidEvent.name);
  }

  private async handle(event: PaymentPaidEvent) {
    const appointment = await this.appointmentsRepository.findById(
      event.appointmentId.toString(),
    );

    if (!appointment) {
      throw new ResourceNotFoundError({ resource: "appointment" });
    }

    if (appointment.status === "SCHEDULED") {
      return;
    }

    if (appointment.status !== "AWAITING_PAYMENT") {
      throw new InvalidAppointmentStatusTransitionError(
        "Only appointments awaiting payment or already scheduled can confirm payment.",
      );
    }

    appointment.confirmPayment(event.paidAt);
    await this.appointmentsRepository.save(appointment);
  }
}
