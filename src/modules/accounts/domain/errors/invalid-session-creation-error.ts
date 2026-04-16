export class InvalidSessionCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSessionCreationError";
  }
}
