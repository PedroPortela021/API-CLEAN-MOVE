import { Prisma } from "../../../generated/prisma/client";
import { PersistenceError } from "../../../shared/errors/persistence-error";
import { UniqueConstraintViolationError } from "../../../shared/errors/unique-constraint-violation-error";

export function rethrowPrismaRepositoryError(error: unknown): never {
  if (error instanceof UniqueConstraintViolationError) {
    throw error;
  }

  if (error instanceof PersistenceError) {
    throw error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new UniqueConstraintViolationError();
    }

    throw new PersistenceError();
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new PersistenceError();
  }

  if (error instanceof Error) {
    throw new PersistenceError();
  }

  throw new PersistenceError();
}
