import { Payment } from "../../payment/domain/entities/payment";

export abstract class PaymentsRepository {
  abstract create(payment: Payment): Promise<void>;
  abstract findById(id: string): Promise<Payment | null>;
  abstract findByProviderNameAndPaymentId(
    providerName: string,
    providerPaymentId: string,
  ): Promise<Payment | null>;
  abstract findManyByAppointmentId(appointmentId: string): Promise<Payment[]>;
  abstract findManyPending(): Promise<Payment[]>;
  abstract save(payment: Payment): Promise<void>;
}
