export class InvalidSessionError extends Error {
  constructor(message?: string) {
    super(message ?? "Invalid or expired session.");
  }
}
