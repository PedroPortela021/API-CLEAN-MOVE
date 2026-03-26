export class NoUpdateFieldsProvidedError extends Error {
  constructor() {
    super("At least one field must be provided for update.");
  }
}
