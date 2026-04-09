import type { UniqueEntityId } from "../../../../shared/entities/unique-entity-id.js";
import type { DomainEvent } from "../../../../shared/events/domain-event.js";
import { Appointment } from "../entities/appointment";

export class AppointmentCancelledEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly appointmentId: UniqueEntityId;
  public readonly cancelledAt: Date;

  constructor(appointment: Appointment, occurredAt: Date = new Date()) {
    this.occurredAt = occurredAt;
    this.appointmentId = appointment.id;
    this.cancelledAt = appointment.cancelledAt ?? occurredAt;
  }

  getAggregateId(): UniqueEntityId {
    return this.appointmentId;
  }
}
