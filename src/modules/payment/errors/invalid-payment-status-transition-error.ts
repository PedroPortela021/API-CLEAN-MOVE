export class InvalidPaymentStatusTransitionError extends Error {
  constructor(message?: string) {
    super(message ?? "It wasn't possible to change the payment status.");
    this.name = "InvalidPaymentStatusTransitionError";
  }
}
