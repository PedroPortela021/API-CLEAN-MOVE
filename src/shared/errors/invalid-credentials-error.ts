export class InvalidCredentialsError extends Error {
  constructor(message = "Invalid Credentials.") {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}
