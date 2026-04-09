import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { DomainEvents } from "../../../../shared/events/domain-events";
import { PaymentExpiredEvent } from "../../../payment/domain/events/payment-expired-event";
import { InvalidAppointmentStatusTransitionError } from "../../../scheduling/domain/errors/invalid-appointment-status-transition-error";
import { AppointmentsRepository } from "../../repositories/appointments-repository";

export class OnPaymentExpiredSubscriber {
  constructor(private appointmentsRepository: AppointmentsRepository) {
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    DomainEvents.register(this.handle.bind(this), PaymentExpiredEvent.name);
  }

  private async handle(event: PaymentExpiredEvent) {
    const appointment = await this.appointmentsRepository.findById(
      event.appointmentId.toString(),
    );

    if (!appointment) {
      throw new ResourceNotFoundError({ resource: "appointment" });
    }

    if (appointment.status === "EXPIRED") {
      return;
    }

    if (appointment.status !== "AWAITING_PAYMENT") {
      throw new InvalidAppointmentStatusTransitionError(
        "Only appointments awaiting payment or already expired can expire the payment window.",
      );
    }

    appointment.expirePayment(event.expiredAt);
    await this.appointmentsRepository.save(appointment);
  }
}
