export class CheckoutCompensationFailedError extends Error {
  constructor(readonly recoveryId: string) {
    super(
      `Checkout compensation failed. Recovery ${recoveryId} was scheduled.`,
    );
    this.name = "CheckoutCompensationFailedError";
  }
}
