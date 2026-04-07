import { UnitOfWork } from "../../src/modules/application/repositories/unit-of-work";

export class InMemoryUnitOfWork implements UnitOfWork {
  async execute<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}
