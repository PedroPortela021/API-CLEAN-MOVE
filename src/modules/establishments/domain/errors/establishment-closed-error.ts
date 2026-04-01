export class EstablishmentClosedError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "This establishment is not open during these hours. Please choose another time.",
    );
    this.name = "EstablishmentClosedError";
  }
}
