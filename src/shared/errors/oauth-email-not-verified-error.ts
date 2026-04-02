export class OAuthEmailNotVerifiedError extends Error {
  constructor(message = "OAuth email is not verified.") {
    super(message);
    this.name = "OAuthEmailNotVerifiedError";
  }
}
