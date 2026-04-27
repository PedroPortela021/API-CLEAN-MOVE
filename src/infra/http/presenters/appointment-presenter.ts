import { Appointment } from "../../../modules/scheduling/domain/entities/appointment";

export class AppointmentPresenter {
  static toHTTP(appointment: Appointment) {
    return {
      id: appointment.id.toString(),
      establishmentId: appointment.establishmentId.toString(),
      customerId: appointment.customerId.toString(),
      bookedByCustomer: appointment.bookedByCustomer,
      service: {
        id: appointment.service.serviceId.toString(),
        name: appointment.service.serviceName,
        category: appointment.service.category ?? null,
        durationInMinutes: appointment.service.durationInMinutes ?? null,
        priceInCents: appointment.service.priceInCents,
      },
      slot: {
        startsAt: appointment.slot.startsAt.toISOString(),
        endsAt: appointment.slot.endsAt.toISOString(),
      },
      status: appointment.status,
      createdAt: appointment.createdAt?.toISOString() ?? null,
      updatedAt: appointment.updatedAt?.toISOString() ?? null,
      confirmedAt: appointment.confirmedAt?.toISOString() ?? null,
      cancelledAt: appointment.cancelledAt?.toISOString() ?? null,
      expiredAt: appointment.expiredAt?.toISOString() ?? null,
      reservationExpiresAt:
        appointment.reservationExpiresAt?.toISOString() ?? null,
    };
  }
}
