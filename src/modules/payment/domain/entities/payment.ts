import { AggregateRoot } from "../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Optional } from "../../../../shared/types/optional";
import { PaymentExpiredEvent } from "../events/payment-expired-event";
import { PaymentPaidEvent } from "../events/payment-paid-event";
import { InvalidPaymentStatusTransitionError } from "../errors/invalid-payment-status-transition-error";

export type PaymentMethod = "PIX";

export type PaymentStatus =
  | "INITIATED"
  | "PENDING"
  | "PAID"
  | "EXPIRED"
  | "CANCELLED";

export type PaymentProps = {
  appointmentId: UniqueEntityId;
  customerId: UniqueEntityId;
  establishmentId: UniqueEntityId;
  paymentMethod: PaymentMethod;
  amountInCents: number;
  providerName: string | null;
  providerPaymentId: string | null;
  pixQrCode: string | null;
  pixCopyPasteCode: string | null;
  pixExpiresAt: Date | null;
  status: PaymentStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
  paidAt: Date | null;
  expiredAt: Date | null;
  cancelledAt: Date | null;
};

export class InvalidPaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPaymentError";
  }
}

export class Payment extends AggregateRoot<PaymentProps> {
  get appointmentId() {
    return this.props.appointmentId;
  }

  get customerId() {
    return this.props.customerId;
  }

  get establishmentId() {
    return this.props.establishmentId;
  }

  get paymentMethod() {
    return this.props.paymentMethod;
  }

  get amountInCents() {
    return this.props.amountInCents;
  }

  get amount() {
    return this.props.amountInCents / 100;
  }

  get providerName() {
    return this.props.providerName;
  }

  get providerPaymentId() {
    return this.props.providerPaymentId;
  }

  get pixQrCode() {
    return this.props.pixQrCode;
  }

  get pixCopyPasteCode() {
    return this.props.pixCopyPasteCode;
  }

  get pixExpiresAt() {
    return this.props.pixExpiresAt;
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

  get paidAt() {
    return this.props.paidAt;
  }

  get expiredAt() {
    return this.props.expiredAt;
  }

  get cancelledAt() {
    return this.props.cancelledAt;
  }

  static create(
    props: Optional<
      PaymentProps,
      | "paymentMethod"
      | "providerName"
      | "providerPaymentId"
      | "pixQrCode"
      | "pixCopyPasteCode"
      | "pixExpiresAt"
      | "status"
      | "createdAt"
      | "updatedAt"
      | "paidAt"
      | "expiredAt"
      | "cancelledAt"
    >,
    id?: UniqueEntityId,
  ) {
    Payment.assertValidIdentifiers({
      appointmentId: props.appointmentId,
      customerId: props.customerId,
      establishmentId: props.establishmentId,
    });
    Payment.assertValidAmount(props.amountInCents);

    const payment = new Payment(
      {
        ...props,
        paymentMethod: props.paymentMethod ?? "PIX",
        providerName: props.providerName ?? null,
        providerPaymentId: props.providerPaymentId ?? null,
        pixQrCode: props.pixQrCode ?? null,
        pixCopyPasteCode: props.pixCopyPasteCode ?? null,
        pixExpiresAt: props.pixExpiresAt ?? null,
        status: props.status ?? "INITIATED",
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        paidAt: props.paidAt ?? null,
        expiredAt: props.expiredAt ?? null,
        cancelledAt: props.cancelledAt ?? null,
      },
      id,
    );

    payment.assertValidState();

    return payment;
  }

  issuePixCharge(
    params: {
      providerName: string;
      providerPaymentId: string;
      pixQrCode: string;
      pixCopyPasteCode: string;
      pixExpiresAt: Date;
    },
    referenceDate: Date = new Date(),
  ) {
    if (this.props.status !== "INITIATED") {
      throw new InvalidPaymentStatusTransitionError(
        "Only initiated payments can issue a Pix charge.",
      );
    }

    const providerName = params.providerName.trim();
    const providerPaymentId = params.providerPaymentId.trim();
    const pixQrCode = params.pixQrCode.trim();
    const pixCopyPasteCode = params.pixCopyPasteCode.trim();

    if (!providerName) {
      throw new InvalidPaymentError("providerName cannot be empty.");
    }

    if (!providerPaymentId) {
      throw new InvalidPaymentError("providerPaymentId cannot be empty.");
    }

    if (!pixQrCode) {
      throw new InvalidPaymentError("pixQrCode cannot be empty.");
    }

    if (!pixCopyPasteCode) {
      throw new InvalidPaymentError("pixCopyPasteCode cannot be empty.");
    }

    if (Number.isNaN(params.pixExpiresAt.getTime())) {
      throw new InvalidPaymentError("pixExpiresAt must be a valid date.");
    }

    if (params.pixExpiresAt.getTime() <= referenceDate.getTime()) {
      throw new InvalidPaymentError("pixExpiresAt must be a future date.");
    }

    this.props.providerName = providerName;
    this.props.providerPaymentId = providerPaymentId;
    this.props.pixQrCode = pixQrCode;
    this.props.pixCopyPasteCode = pixCopyPasteCode;
    this.props.pixExpiresAt = params.pixExpiresAt;
    this.props.status = "PENDING";
    this.touch(referenceDate);
  }

  isPixExpired(referenceDate: Date = new Date()) {
    if (this.props.status === "EXPIRED") {
      return true;
    }

    if (this.props.status !== "PENDING") {
      return false;
    }

    if (!this.props.pixExpiresAt) {
      return false;
    }

    return this.props.pixExpiresAt.getTime() <= referenceDate.getTime();
  }

  markAsPaid(referenceDate: Date = new Date()) {
    if (this.props.status !== "PENDING") {
      throw new InvalidPaymentStatusTransitionError(
        "Only pending payments can be marked as paid.",
      );
    }

    this.props.status = "PAID";
    this.props.paidAt = referenceDate;
    this.props.expiredAt = null;
    this.props.cancelledAt = null;
    this.touch(referenceDate);
    this.addDomainEvent(new PaymentPaidEvent(this, referenceDate));
  }

  expire(referenceDate: Date = new Date()) {
    if (this.props.status !== "PENDING") {
      throw new InvalidPaymentStatusTransitionError(
        "Only pending payments can expire.",
      );
    }

    if (!this.isPixExpired(referenceDate)) {
      throw new InvalidPaymentStatusTransitionError(
        "It wasn't possible to expire the payment before the Pix deadline.",
      );
    }

    this.props.status = "EXPIRED";
    this.props.expiredAt = referenceDate;
    this.touch(referenceDate);
    this.addDomainEvent(new PaymentExpiredEvent(this, referenceDate));
  }

  cancel(referenceDate: Date = new Date()) {
    if (
      this.props.status === "PAID" ||
      this.props.status === "EXPIRED" ||
      this.props.status === "CANCELLED"
    ) {
      throw new InvalidPaymentStatusTransitionError();
    }

    this.props.status = "CANCELLED";
    this.props.cancelledAt = referenceDate;
    this.touch(referenceDate);
  }

  private touch(referenceDate: Date = new Date()) {
    this.props.updatedAt = referenceDate;
  }

  private assertValidState() {
    if (this.props.paymentMethod !== "PIX") {
      throw new InvalidPaymentError("Invalid paymentMethod.");
    }

    if (
      this.props.status === "PAID" &&
      !(this.props.paidAt instanceof Date) &&
      this.props.paidAt !== null
    ) {
      throw new InvalidPaymentError("paidAt must be a valid date.");
    }

    if (this.props.status === "PAID" && this.props.paidAt === null) {
      throw new InvalidPaymentError("paidAt is required when payment is PAID.");
    }

    if (this.props.status === "EXPIRED" && this.props.expiredAt === null) {
      throw new InvalidPaymentError(
        "expiredAt is required when payment is EXPIRED.",
      );
    }

    if (this.props.status === "CANCELLED" && this.props.cancelledAt === null) {
      throw new InvalidPaymentError(
        "cancelledAt is required when payment is CANCELLED.",
      );
    }

    if (this.props.status === "PENDING") {
      if (!this.props.providerName?.trim()) {
        throw new InvalidPaymentError(
          "providerName is required when payment is PENDING.",
        );
      }

      if (!this.props.providerPaymentId?.trim()) {
        throw new InvalidPaymentError(
          "providerPaymentId is required when payment is PENDING.",
        );
      }

      if (!this.props.pixQrCode?.trim()) {
        throw new InvalidPaymentError(
          "pixQrCode is required when payment is PENDING.",
        );
      }

      if (!this.props.pixCopyPasteCode?.trim()) {
        throw new InvalidPaymentError(
          "pixCopyPasteCode is required when payment is PENDING.",
        );
      }

      if (!(this.props.pixExpiresAt instanceof Date)) {
        throw new InvalidPaymentError(
          "pixExpiresAt is required when payment is PENDING.",
        );
      }

      if (Number.isNaN(this.props.pixExpiresAt.getTime())) {
        throw new InvalidPaymentError("pixExpiresAt must be a valid date.");
      }
    }
  }

  private static assertValidIdentifiers(props: {
    appointmentId: UniqueEntityId;
    customerId: UniqueEntityId;
    establishmentId: UniqueEntityId;
  }) {
    if (!(props.appointmentId instanceof UniqueEntityId)) {
      throw new InvalidPaymentError("Invalid appointmentId.");
    }

    if (!(props.customerId instanceof UniqueEntityId)) {
      throw new InvalidPaymentError("Invalid customerId.");
    }

    if (!(props.establishmentId instanceof UniqueEntityId)) {
      throw new InvalidPaymentError("Invalid establishmentId.");
    }
  }

  private static assertValidAmount(amountInCents: number) {
    if (!Number.isInteger(amountInCents)) {
      throw new InvalidPaymentError("amountInCents must be an integer.");
    }

    if (amountInCents <= 0) {
      throw new InvalidPaymentError("amountInCents must be greater than zero.");
    }
  }
}
