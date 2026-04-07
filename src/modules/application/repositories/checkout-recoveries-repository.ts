import { CheckoutRecovery } from "../../payment/entities/checkout-recovery";

export abstract class CheckoutRecoveriesRepository {
  abstract create(recovery: CheckoutRecovery): Promise<void>;
  abstract findById(id: string): Promise<CheckoutRecovery | null>;
  abstract findManyPending(): Promise<CheckoutRecovery[]>;
  abstract save(recovery: CheckoutRecovery): Promise<void>;
}
