export class InvalidOrExpiredPasswordResetCodeError extends Error {
  constructor() {
    super("Invalid or expired password reset code.");
    this.name = "InvalidOrExpiredPasswordResetCodeError";
  }
}
