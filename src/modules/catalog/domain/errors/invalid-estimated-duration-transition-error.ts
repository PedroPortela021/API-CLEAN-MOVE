export class InvalidEstimatedDurationTransitionError extends Error {
  constructor() {
    super("minInMinutes cannot be greater than the current maxInMinutes.");
    this.name = "InvalidEstimatedDurationTransitionError";
  }
}
