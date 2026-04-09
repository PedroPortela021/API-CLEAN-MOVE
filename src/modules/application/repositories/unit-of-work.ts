import { DomainEvents } from "../../../shared/events/domain-events.js";

export abstract class UnitOfWork {
  async execute<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await this.perform(async () => {
        const result = await work();

        await DomainEvents.dispatchEventsForMarkedAggregates();

        return result;
      });
    } catch (error) {
      DomainEvents.clearMarkedAggregates();
      throw error;
    }
  }

  protected abstract perform<T>(work: () => Promise<T>): Promise<T>;
}
