export class InvalidRegisterEstablishmentInputError extends Error {
  constructor(message?: string) {
    super(message ?? "Invalid inputs");
    this.name = "InvalidRegisterEstablishmentInputError";
  }
}
