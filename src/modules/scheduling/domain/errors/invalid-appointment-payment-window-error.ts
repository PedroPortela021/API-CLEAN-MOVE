export class InvalidAppointmentPaymentWindowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAppointmentPaymentWindowError";
  }
}
