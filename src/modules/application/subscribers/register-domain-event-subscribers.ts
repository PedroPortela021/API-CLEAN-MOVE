import { AppointmentsRepository } from "../repositories/appointments-repository";
import { PaymentsRepository } from "../repositories/payments-repository";
import { OnAppointmentCancelledSubscriber } from "./appointment/on-appointment-cancelled";
import { OnPaymentExpiredSubscriber } from "./payment/on-payment-expired";
import { OnPaymentPaidSubscriber } from "./payment/on-payment-paid";

type RegisterDomainEventSubscribersParams = {
  appointmentsRepository: AppointmentsRepository;
  paymentsRepository: PaymentsRepository;
};

export function registerDomainEventSubscribers({
  appointmentsRepository,
  paymentsRepository,
}: RegisterDomainEventSubscribersParams) {
  return [
    new OnAppointmentCancelledSubscriber(paymentsRepository),
    new OnPaymentPaidSubscriber(appointmentsRepository),
    new OnPaymentExpiredSubscriber(appointmentsRepository),
  ];
}
