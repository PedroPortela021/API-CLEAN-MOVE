export class ProfileAlreadyCompleteError extends Error {
  constructor() {
    super("User profile is already complete.");
    this.name = "ProfileAlreadyCompleteError";
  }
}
