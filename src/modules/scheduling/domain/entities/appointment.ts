import { AggregateRoot } from "../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Optional } from "../../../../shared/types/optional";
import { InvalidAppointmentStatusTransitionError } from "../errors/invalid-appointment-status-transition-error";
import { BookedServiceSnapshot } from "../value-objects/booked-service-snapshot";
import { TimeSlot } from "../value-objects/time-slot";

export type AppointmentStatus =
  | "IN_PROGRESS"
  | "FINISHED"
  | "CANCELLED"
  | "SCHEDULED";

export type AppointmentProps = {
  establishmentId: UniqueEntityId;
  customerId: UniqueEntityId;
  bookedByCustomer: boolean;
  service: BookedServiceSnapshot;
  slot: TimeSlot;
  status: AppointmentStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
  cancelledAt: Date | null;
};

export class Appointment extends AggregateRoot<AppointmentProps> {
  get establishmentId() {
    return this.props.establishmentId;
  }

  get customerId() {
    return this.props.customerId;
  }

  get bookedByCustomer() {
    return this.props.bookedByCustomer;
  }

  get service() {
    return this.props.service;
  }

  get slot() {
    return this.props.slot;
  }

  get status() {
    return this.props.status;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get cancelledAt() {
    return this.props.cancelledAt;
  }

  static create(
    props: Optional<
      AppointmentProps,
      "bookedByCustomer" | "createdAt" | "updatedAt" | "status" | "cancelledAt"
    >,
    id?: UniqueEntityId,
  ) {
    const appointment = new Appointment(
      {
        ...props,
        bookedByCustomer: props.bookedByCustomer ?? false,
        cancelledAt: props.cancelledAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        status: props.status ?? "SCHEDULED",
      },
      id,
    );

    return appointment;
  }

  touch() {
    this.props.updatedAt = new Date();
  }

  cancel() {
    if (this.props.status === "CANCELLED") {
      throw new InvalidAppointmentStatusTransitionError();
    }

    if (this.props.status === "FINISHED") {
      throw new InvalidAppointmentStatusTransitionError();
    }

    this.props.status = "CANCELLED";
    this.props.cancelledAt = new Date();
    this.touch();
  }

  advanceStatus() {
    if (this.props.status === "CANCELLED" || this.props.status === "FINISHED") {
      throw new InvalidAppointmentStatusTransitionError();
    }

    if (this.props.status === "SCHEDULED") {
      this.props.status = "IN_PROGRESS";
    } else {
      this.props.status = "FINISHED";
    }

    this.touch();
  }

  reschedule(newSlot: TimeSlot) {
    if (this.props.status !== "SCHEDULED") {
      throw new InvalidAppointmentStatusTransitionError();
    }

    this.props.slot = newSlot;
    this.touch();
  }
}
