export class InvalidRegisterCustomerInputError extends Error {
  constructor(message?: string) {
    super(message ?? "Invalid inputs");
    this.name = "InvalidRegisterCustomerInputError";
  }
}
