import type { UniqueEntityId } from "../../../../shared/entities/unique-entity-id.js";
import type { DomainEvent } from "../../../../shared/events/domain-event.js";
import { Payment } from "../entities/payment";

export class PaymentPaidEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly paymentId: UniqueEntityId;
  public readonly appointmentId: UniqueEntityId;
  public readonly paidAt: Date;

  constructor(payment: Payment, occurredAt: Date = new Date()) {
    this.occurredAt = occurredAt;
    this.paymentId = payment.id;
    this.appointmentId = payment.appointmentId;
    this.paidAt = payment.paidAt ?? occurredAt;
  }

  getAggregateId(): UniqueEntityId {
    return this.paymentId;
  }
}
