import { AggregateRoot } from "../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Optional } from "../../../../shared/types/optional";

export type CheckoutRecoveryReason =
  | "PAYMENT_CREATION_FAILED"
  | "PAYMENT_GATEWAY_FAILED";

export type CheckoutRecoveryStatus = "PENDING" | "RESOLVED";

export type CheckoutRecoveryProps = {
  appointmentId: UniqueEntityId;
  paymentId: UniqueEntityId | null;
  reason: CheckoutRecoveryReason;
  appointmentCompensationPending: boolean;
  paymentCompensationPending: boolean;
  failureMessage: string;
  status: CheckoutRecoveryStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
  resolvedAt: Date | null;
};

export class InvalidCheckoutRecoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCheckoutRecoveryError";
  }
}

export class CheckoutRecovery extends AggregateRoot<CheckoutRecoveryProps> {
  get appointmentId() {
    return this.props.appointmentId;
  }

  get paymentId() {
    return this.props.paymentId;
  }

  get reason() {
    return this.props.reason;
  }

  get appointmentCompensationPending() {
    return this.props.appointmentCompensationPending;
  }

  get paymentCompensationPending() {
    return this.props.paymentCompensationPending;
  }

  get failureMessage() {
    return this.props.failureMessage;
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

  get resolvedAt() {
    return this.props.resolvedAt;
  }

  static create(
    props: Optional<
      CheckoutRecoveryProps,
      "status" | "createdAt" | "updatedAt" | "resolvedAt"
    >,
    id?: UniqueEntityId,
  ) {
    CheckoutRecovery.assertIdentifiers({
      appointmentId: props.appointmentId,
      paymentId: props.paymentId,
    });

    const failureMessage = props.failureMessage.trim();

    if (!failureMessage) {
      throw new InvalidCheckoutRecoveryError("failureMessage cannot be empty.");
    }

    if (
      !props.appointmentCompensationPending &&
      !props.paymentCompensationPending
    ) {
      throw new InvalidCheckoutRecoveryError(
        "At least one pending compensation is required.",
      );
    }

    return new CheckoutRecovery(
      {
        ...props,
        failureMessage,
        status: props.status ?? "PENDING",
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        resolvedAt: props.resolvedAt ?? null,
      },
      id,
    );
  }

  markAsResolved(referenceDate: Date = new Date()) {
    this.props.status = "RESOLVED";
    this.props.appointmentCompensationPending = false;
    this.props.paymentCompensationPending = false;
    this.props.resolvedAt = referenceDate;
    this.touch(referenceDate);
  }

  private touch(referenceDate: Date = new Date()) {
    this.props.updatedAt = referenceDate;
  }

  private static assertIdentifiers({
    appointmentId,
    paymentId,
  }: {
    appointmentId: UniqueEntityId;
    paymentId: UniqueEntityId | null;
  }) {
    if (!(appointmentId instanceof UniqueEntityId)) {
      throw new InvalidCheckoutRecoveryError("Invalid appointmentId.");
    }

    if (paymentId !== null && !(paymentId instanceof UniqueEntityId)) {
      throw new InvalidCheckoutRecoveryError("Invalid paymentId.");
    }
  }
}
