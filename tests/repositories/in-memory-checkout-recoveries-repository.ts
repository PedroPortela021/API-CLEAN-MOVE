import { CheckoutRecoveriesRepository } from "../../src/modules/application/repositories/checkout-recoveries-repository";
import { CheckoutRecovery } from "../../src/modules/payment/entities/checkout-recovery";

export class InMemoryCheckoutRecoveriesRepository implements CheckoutRecoveriesRepository {
  public items: CheckoutRecovery[] = [];

  async create(recovery: CheckoutRecovery): Promise<void> {
    this.items.push(recovery);
  }

  async findById(id: string): Promise<CheckoutRecovery | null> {
    const recovery = this.items.find((item) => item.id.toString() === id);

    if (!recovery) {
      return null;
    }

    return recovery;
  }

  async findManyPending(): Promise<CheckoutRecovery[]> {
    return this.items.filter((item) => item.status === "PENDING");
  }

  async save(recovery: CheckoutRecovery): Promise<void> {
    const recoveryIndex = this.items.findIndex((item) =>
      item.id.equals(recovery.id),
    );

    if (recoveryIndex === -1) {
      this.items.push(recovery);
      return;
    }

    this.items[recoveryIndex] = recovery;
  }
}
