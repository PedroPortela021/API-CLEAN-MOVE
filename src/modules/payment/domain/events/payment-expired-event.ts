import type { UniqueEntityId } from "../../../../shared/entities/unique-entity-id.js";
import type { DomainEvent } from "../../../../shared/events/domain-event.js";
import { Payment } from "../entities/payment";

export class PaymentExpiredEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly paymentId: UniqueEntityId;
  public readonly appointmentId: UniqueEntityId;
  public readonly expiredAt: Date;

  constructor(payment: Payment, occurredAt: Date = new Date()) {
    this.occurredAt = occurredAt;
    this.paymentId = payment.id;
    this.appointmentId = payment.appointmentId;
    this.expiredAt = payment.expiredAt ?? occurredAt;
  }

  getAggregateId(): UniqueEntityId {
    return this.paymentId;
  }
}
