import { PaymentsRepository } from "../../src/modules/application/repositories/payments-repository";
import { Payment } from "../../src/modules/payment/entities/payment";

export class InMemoryPaymentsRepository implements PaymentsRepository {
  public items: Payment[] = [];

  async create(payment: Payment): Promise<void> {
    this.items.push(payment);
  }

  async findById(id: string): Promise<Payment | null> {
    const payment = this.items.find((item) => item.id.toString() === id);

    if (!payment) {
      return null;
    }

    return payment;
  }

  async findByProviderNameAndPaymentId(
    providerName: string,
    providerPaymentId: string,
  ): Promise<Payment | null> {
    const payment = this.items.find(
      (item) =>
        item.providerName === providerName &&
        item.providerPaymentId === providerPaymentId,
    );

    if (!payment) {
      return null;
    }

    return payment;
  }

  async findManyByAppointmentId(appointmentId: string): Promise<Payment[]> {
    return this.items.filter(
      (item) => item.appointmentId.toString() === appointmentId,
    );
  }

  async findManyPending(): Promise<Payment[]> {
    return this.items.filter((item) => item.status === "PENDING");
  }

  async save(payment: Payment): Promise<void> {
    const paymentIndex = this.items.findIndex((item) =>
      item.id.equals(payment.id),
    );

    if (paymentIndex === -1) {
      this.items.push(payment);
      return;
    }

    this.items[paymentIndex] = payment;
  }
}
