export class PersistenceError extends Error {
  constructor(message = "Could not persist data.") {
    super(message);
    this.name = "PersistenceError";
  }
}
