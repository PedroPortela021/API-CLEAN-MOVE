import { Either, left, right } from "../../../../shared/either";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { UnexpectedDomainError } from "../../../../shared/errors/unexpected-domain-error";
import { NotAllowedError } from "../../../../shared/errors/not-allowed-error";
import { InactiveServiceError } from "../../../catalog/domain/errors/inactive-service-error";
import { EstablishmentClosedError } from "../../../establishments/domain/errors/establishment-closed-error";
import {
  InvalidPaymentError,
  Payment,
} from "../../../payment/entities/payment";
import { InvalidPaymentStatusTransitionError } from "../../../payment/errors/invalid-payment-status-transition-error";
import { Appointment } from "../../../scheduling/domain/entities/appointment";
import { InvalidBookServiceInputError } from "../../../scheduling/domain/errors/invalid-book-service-input-error";
import { TimeSlotAlreadyBookedError } from "../../../scheduling/domain/errors/time-slot-already-booked-error";
import { AppointmentAuthor } from "../../../scheduling/domain/policies/appointment-authorization";
import { PaymentGateway } from "../../gateways/payment";
import { AppointmentsRepository } from "../../repositories/appointments-repository";
import { PaymentsRepository } from "../../repositories/payments-repository";
import { AppointmentBookingService } from "../../services/appointment-booking-service";

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
  | UnexpectedDomainError,
  {
    appointment: Appointment;
    payment: Payment;
  }
>;

export class StartAppointmentCheckoutUseCase {
  constructor(
    private appointmentBookingService: AppointmentBookingService,
    private appointmentsRepository: AppointmentsRepository,
    private paymentsRepository: PaymentsRepository,
    private paymentGateway: PaymentGateway,
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

    let payment: Payment;

    try {
      payment = Payment.create({
        appointmentId: appointment.id,
        customerId: appointment.customerId,
        establishmentId: appointment.establishmentId,
        amountInCents: appointment.service.priceInCents,
      });
    } catch (error) {
      await this.rollbackAppointmentCheckout(appointment);

      if (error instanceof InvalidPaymentError) {
        return left(new UnexpectedDomainError());
      }

      return left(new UnexpectedDomainError());
    }

    await this.paymentsRepository.create(payment);

    try {
      const pixPayment = await this.paymentGateway.createPixPayment({
        paymentId: payment.id.toString(),
        appointmentId: appointment.id.toString(),
        amountInCents: payment.amountInCents,
        description: appointment.service.serviceName,
        expiresAt: reservationExpiresAt,
      });

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
    } catch (error) {
      await this.rollbackCheckoutFailure({
        appointment,
        payment,
        now,
      });

      if (
        error instanceof InvalidPaymentError ||
        error instanceof InvalidPaymentStatusTransitionError
      ) {
        return left(new UnexpectedDomainError());
      }

      return left(new UnexpectedDomainError());
    }

    return right({
      appointment,
      payment,
    });
  }

  private async rollbackCheckoutFailure({
    appointment,
    payment,
    now,
  }: {
    appointment: Appointment;
    payment: Payment;
    now: Date;
  }) {
    await this.rollbackAppointmentCheckout(appointment);

    try {
      payment.cancel(now);
      await this.paymentsRepository.save(payment);
    } catch {
      // Best effort rollback to avoid leaving the slot blocked on checkout failures.
    }
  }

  private async rollbackAppointmentCheckout(appointment: Appointment) {
    try {
      appointment.cancel();
      await this.appointmentsRepository.save(appointment);
    } catch {
      // Best effort rollback to avoid leaving the slot blocked on checkout failures.
    }
  }
}
