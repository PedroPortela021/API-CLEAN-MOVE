import type { UniqueEntityId } from '../entities/unique-entity-id.js';

export interface DomainEvent {
  ocurredAt: Date;
  getAggregateId(): UniqueEntityId;
}
