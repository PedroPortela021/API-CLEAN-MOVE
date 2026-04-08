import { Either, left, right } from "../../../../shared/either";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { UnexpectedDomainError } from "../../../../shared/errors/unexpected-domain-error";
import { NotAllowedError } from "../../../../shared/errors/not-allowed-error";
import { InactiveServiceError } from "../../../catalog/domain/errors/inactive-service-error";
import { EstablishmentClosedError } from "../../../establishments/domain/errors/establishment-closed-error";
import { CheckoutCompensationFailedError } from "../../../payment/domain/errors/checkout-compensation-failed-error";
import {
  InvalidPaymentError,
  Payment,
} from "../../../payment/domain/entities/payment";
import { CheckoutRecoveryReason } from "../../../payment/domain/entities/checkout-recovery";
import { InvalidPaymentStatusTransitionError } from "../../../payment/domain/errors/invalid-payment-status-transition-error";
import { Appointment } from "../../../scheduling/domain/entities/appointment";
import { InvalidBookServiceInputError } from "../../../scheduling/domain/errors/invalid-book-service-input-error";
import { TimeSlotAlreadyBookedError } from "../../../scheduling/domain/errors/time-slot-already-booked-error";
import { AppointmentAuthor } from "../../../scheduling/domain/policies/appointment-authorization";
import { PaymentGateway } from "../../gateways/payment";
import { PaymentsRepository } from "../../repositories/payments-repository";
import { UnitOfWork } from "../../repositories/unit-of-work";
import { AppointmentBookingService } from "../../services/appointment-booking-service";
import { CheckoutCompensationService } from "../../services/checkout-compensation-service";

const DEFAULT_PIX_EXPIRATION_MS = 15 * 60 * 1000;

type StartAppointmentCheckoutUseCaseRequest = {
  establishmentId: string;
  customerId: string;
  serviceId: string;
  author: AppointmentAuthor;
  startsAt: Date;
};

type StartAppointmentCheckoutUseCaseResponse = Either<
  | ResourceNotFoundError
  | NotAllowedError
  | InactiveServiceError
  | EstablishmentClosedError
  | TimeSlotAlreadyBookedError
  | InvalidBookServiceInputError
  | CheckoutCompensationFailedError
  | UnexpectedDomainError,
  {
    appointment: Appointment;
    payment: Payment;
  }
>;

export class StartAppointmentCheckoutUseCase {
  constructor(
    private appointmentBookingService: AppointmentBookingService,
    private paymentsRepository: PaymentsRepository,
    private paymentGateway: PaymentGateway,
    private checkoutCompensationService: CheckoutCompensationService,
    private unitOfWork: UnitOfWork,
    private pixExpirationMs: number = DEFAULT_PIX_EXPIRATION_MS,
  ) {}

  async execute({
    establishmentId,
    customerId,
    serviceId,
    author,
    startsAt,
  }: StartAppointmentCheckoutUseCaseRequest): Promise<StartAppointmentCheckoutUseCaseResponse> {
    const now = new Date();
    const reservationExpiresAt = new Date(now.getTime() + this.pixExpirationMs);

    const bookingResult = await this.appointmentBookingService.execute({
      establishmentId,
      customerId,
      serviceId,
      author,
      reservationExpiresAt,
      startsAt,
    });

    if (bookingResult.isLeft()) {
      return left(bookingResult.value);
    }

    const { appointment } = bookingResult.value;

    let payment: Payment | null = null;

    try {
      const createdPayment = Payment.create({
        appointmentId: appointment.id,
        customerId: appointment.customerId,
        establishmentId: appointment.establishmentId,
        amountInCents: appointment.service.priceInCents,
      });
      payment = createdPayment;

      await this.unitOfWork.execute(async () => {
        await this.paymentsRepository.create(createdPayment);
      });
    } catch (error) {
      return this.handleCheckoutFailure({
        appointment,
        payment: error instanceof InvalidPaymentError ? null : payment,
        reason: "PAYMENT_CREATION_FAILED",
        cause: error,
        referenceDate: now,
      });
    }

    if (!payment) {
      return left(new UnexpectedDomainError());
    }

    try {
      const pixPayment = await this.paymentGateway.createPixPayment({
        paymentId: payment.id.toString(),
        appointmentId: appointment.id.toString(),
        amountInCents: payment.amountInCents,
        description: appointment.service.serviceName,
        expiresAt: reservationExpiresAt,
      });

      await this.unitOfWork.execute(async () => {
        payment.issuePixCharge(
          {
            providerName: pixPayment.providerName,
            providerPaymentId: pixPayment.providerPaymentId,
            pixQrCode: pixPayment.pixQrCode,
            pixCopyPasteCode: pixPayment.pixCopyPasteCode,
            pixExpiresAt: pixPayment.pixExpiresAt,
          },
          now,
        );

        await this.paymentsRepository.save(payment);
      });
    } catch (error) {
      return this.handleCheckoutFailure({
        appointment,
        payment: payment ?? null,
        reason: "PAYMENT_GATEWAY_FAILED",
        cause: error,
        referenceDate: now,
      });
    }

    return right({
      appointment,
      payment,
    });
  }

  private async handleCheckoutFailure({
    appointment,
    payment,
    reason,
    cause,
    referenceDate,
  }: {
    appointment: Appointment;
    payment: Payment | null;
    reason: CheckoutRecoveryReason;
    cause: unknown;
    referenceDate: Date;
  }): Promise<StartAppointmentCheckoutUseCaseResponse> {
    try {
      const { recovery } = await this.checkoutCompensationService.execute({
        appointment,
        payment,
        reason,
        cause,
        referenceDate,
      });

      if (recovery) {
        return left(
          new CheckoutCompensationFailedError(recovery.id.toString()),
        );
      }
    } catch {
      return left(new UnexpectedDomainError());
    }

    if (
      cause instanceof InvalidPaymentError ||
      cause instanceof InvalidPaymentStatusTransitionError
    ) {
      return left(new UnexpectedDomainError());
    }

    return left(new UnexpectedDomainError());
  }
}
