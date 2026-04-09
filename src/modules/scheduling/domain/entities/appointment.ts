import { AggregateRoot } from "../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Optional } from "../../../../shared/types/optional";
import { AppointmentCancelledEvent } from "../events/appointment-cancelled-event";
import { InvalidAppointmentPaymentWindowError } from "../errors/invalid-appointment-payment-window-error";
import { InvalidAppointmentStatusTransitionError } from "../errors/invalid-appointment-status-transition-error";
import { BookedServiceSnapshot } from "../value-objects/booked-service-snapshot";
import { TimeSlot } from "../value-objects/time-slot";

export type AppointmentStatus =
  | "AWAITING_PAYMENT"
  | "EXPIRED"
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
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  expiredAt: Date | null;
  reservationExpiresAt: Date | null;
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

  get confirmedAt() {
    return this.props.confirmedAt;
  }

  get cancelledAt() {
    return this.props.cancelledAt;
  }

  get expiredAt() {
    return this.props.expiredAt;
  }

  get reservationExpiresAt() {
    return this.props.reservationExpiresAt;
  }

  static create(
    props: Optional<
      AppointmentProps,
      | "bookedByCustomer"
      | "createdAt"
      | "updatedAt"
      | "status"
      | "confirmedAt"
      | "cancelledAt"
      | "expiredAt"
      | "reservationExpiresAt"
    >,
    id?: UniqueEntityId,
  ) {
    const appointment = new Appointment(
      {
        ...props,
        bookedByCustomer: props.bookedByCustomer ?? false,
        confirmedAt: props.confirmedAt ?? null,
        cancelledAt: props.cancelledAt ?? null,
        expiredAt: props.expiredAt ?? null,
        reservationExpiresAt: props.reservationExpiresAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        status: props.status ?? "SCHEDULED",
      },
      id,
    );

    appointment.assertValidState();

    return appointment;
  }

  static createAwaitingPayment(
    props: Optional<
      AppointmentProps,
      | "bookedByCustomer"
      | "createdAt"
      | "updatedAt"
      | "status"
      | "confirmedAt"
      | "cancelledAt"
      | "expiredAt"
    > & {
      reservationExpiresAt: Date;
    },
    id?: UniqueEntityId,
  ) {
    const appointment = Appointment.create(
      {
        ...props,
        status: "AWAITING_PAYMENT",
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );

    appointment.assertValidState({
      validateFuturePaymentWindow: true,
    });

    return appointment;
  }

  touch() {
    this.props.updatedAt = new Date();
  }

  isAwaitingPayment() {
    return this.props.status === "AWAITING_PAYMENT";
  }

  isPaymentWindowExpired(referenceDate: Date = new Date()) {
    if (this.props.status === "EXPIRED") {
      return true;
    }

    if (this.props.status !== "AWAITING_PAYMENT") {
      return false;
    }

    if (!this.props.reservationExpiresAt) {
      return false;
    }

    return this.props.reservationExpiresAt.getTime() <= referenceDate.getTime();
  }

  blocksTimeSlot(referenceDate: Date = new Date()) {
    if (this.props.status === "CANCELLED" || this.props.status === "EXPIRED") {
      return false;
    }

    if (this.props.status === "AWAITING_PAYMENT") {
      return !this.isPaymentWindowExpired(referenceDate);
    }

    return true;
  }

  confirmPayment(referenceDate: Date = new Date()) {
    if (this.props.status !== "AWAITING_PAYMENT") {
      throw new InvalidAppointmentStatusTransitionError(
        "Only appointments awaiting payment can be confirmed.",
      );
    }

    if (this.isPaymentWindowExpired(referenceDate)) {
      throw new InvalidAppointmentStatusTransitionError(
        "It wasn't possible to confirm the appointment because the payment window has expired.",
      );
    }

    this.props.status = "SCHEDULED";
    this.props.confirmedAt = referenceDate;
    this.props.expiredAt = null;
    this.props.reservationExpiresAt = null;
    this.touch();
  }

  expirePayment(referenceDate: Date = new Date()) {
    if (this.props.status !== "AWAITING_PAYMENT") {
      throw new InvalidAppointmentStatusTransitionError(
        "Only appointments awaiting payment can expire.",
      );
    }

    if (!this.isPaymentWindowExpired(referenceDate)) {
      throw new InvalidAppointmentStatusTransitionError(
        "It wasn't possible to expire the appointment before the payment deadline.",
      );
    }

    this.props.status = "EXPIRED";
    this.props.expiredAt = referenceDate;
    this.props.reservationExpiresAt = null;
    this.touch();
  }

  cancel() {
    if (this.props.status === "CANCELLED") {
      throw new InvalidAppointmentStatusTransitionError();
    }

    if (this.props.status === "FINISHED" || this.props.status === "EXPIRED") {
      throw new InvalidAppointmentStatusTransitionError();
    }

    this.props.status = "CANCELLED";
    this.props.cancelledAt = new Date();
    this.props.reservationExpiresAt = null;
    this.touch();
    this.addDomainEvent(
      new AppointmentCancelledEvent(this, this.props.cancelledAt),
    );
  }

  advanceStatus() {
    if (
      this.props.status === "AWAITING_PAYMENT" ||
      this.props.status === "CANCELLED" ||
      this.props.status === "FINISHED" ||
      this.props.status === "EXPIRED"
    ) {
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
    if (
      this.props.status !== "SCHEDULED" &&
      this.props.status !== "AWAITING_PAYMENT"
    ) {
      throw new InvalidAppointmentStatusTransitionError();
    }

    this.props.slot = newSlot;
    this.touch();
  }

  private assertValidState(options?: {
    validateFuturePaymentWindow?: boolean;
  }) {
    if (this.props.status !== "AWAITING_PAYMENT") {
      if (this.props.reservationExpiresAt !== null) {
        throw new InvalidAppointmentPaymentWindowError(
          "reservationExpiresAt is only allowed for appointments awaiting payment.",
        );
      }

      return;
    }

    if (!(this.props.reservationExpiresAt instanceof Date)) {
      throw new InvalidAppointmentPaymentWindowError(
        "reservationExpiresAt must be a valid date.",
      );
    }

    if (Number.isNaN(this.props.reservationExpiresAt.getTime())) {
      throw new InvalidAppointmentPaymentWindowError(
        "reservationExpiresAt must be a valid date.",
      );
    }

    if (!options?.validateFuturePaymentWindow) {
      return;
    }

    const referenceDate = this.props.createdAt ?? new Date();

    if (this.props.reservationExpiresAt.getTime() <= referenceDate.getTime()) {
      throw new InvalidAppointmentPaymentWindowError(
        "reservationExpiresAt must be a future date.",
      );
    }
  }
}
