import { AppointmentsRepository } from "../repositories/appointments-repository";
import { OnPaymentExpiredSubscriber } from "./payment/on-payment-expired";
import { OnPaymentPaidSubscriber } from "./payment/on-payment-paid";

type RegisterDomainEventSubscribersParams = {
  appointmentsRepository: AppointmentsRepository;
};

export function registerDomainEventSubscribers({
  appointmentsRepository,
}: RegisterDomainEventSubscribersParams) {
  return [
    new OnPaymentPaidSubscriber(appointmentsRepository),
    new OnPaymentExpiredSubscriber(appointmentsRepository),
  ];
}
