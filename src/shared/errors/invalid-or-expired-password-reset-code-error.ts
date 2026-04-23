export class InvalidOrExpiredPasswordResetCodeError extends Error {
  constructor() {
    super("Invalid or expired password reset token.");
    this.name = "InvalidOrExpiredPasswordResetCodeError";
  }
}
