import type { UniqueEntityId } from "../entities/unique-entity-id.js";

export interface DomainEvent {
  occurredAt: Date;
  getAggregateId(): UniqueEntityId;
}
