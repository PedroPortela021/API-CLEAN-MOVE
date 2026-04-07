import { Payment } from "../../payment/entities/payment";

export abstract class PaymentsRepository {
  abstract create(payment: Payment): Promise<void>;
  abstract findById(id: string): Promise<Payment | null>;
  abstract findManyByAppointmentId(appointmentId: string): Promise<Payment[]>;
  abstract save(payment: Payment): Promise<void>;
}
