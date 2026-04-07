export abstract class UnitOfWork {
  abstract execute<T>(work: () => Promise<T>): Promise<T>;
}
