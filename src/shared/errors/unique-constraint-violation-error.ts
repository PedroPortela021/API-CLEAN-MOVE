import { PersistenceError } from "./persistence-error";

export class UniqueConstraintViolationError extends PersistenceError {
  constructor(message = "A unique constraint was violated.") {
    super(message);
    this.name = "UniqueConstraintViolationError";
  }
}
