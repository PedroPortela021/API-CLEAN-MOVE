import { UnitOfWork } from "../../src/modules/application/repositories/unit-of-work";

export class InMemoryUnitOfWork extends UnitOfWork {
  protected async perform<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}
