export class InvalidBookServiceInputError extends Error {
  constructor(message?: string) {
    super(message ?? "Invalid inputs");
  }
}
