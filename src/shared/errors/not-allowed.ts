export class NotAllowed extends Error {
  constructor(message?: string) {
    super(message ?? "Not allowed.");
  }
}
