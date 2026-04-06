import {
  Appointment,
  AppointmentProps,
} from "../../src/modules/scheduling/domain/entities/appointment";
import { BookedServiceSnapshot } from "../../src/modules/scheduling/domain/value-objects/booked-service-snapshot";
import { TimeSlot } from "../../src/modules/scheduling/domain/value-objects/time-slot";
import { UniqueEntityId } from "../../src/shared/entities/unique-entity-id";

export function makeAppointment(
  override?: Partial<AppointmentProps>,
  id?: UniqueEntityId,
) {
  return Appointment.create(
    {
      establishmentId: new UniqueEntityId(),
      customerId: new UniqueEntityId(),
      bookedByCustomer: true,
      service: BookedServiceSnapshot.create({
        serviceId: new UniqueEntityId(),
        serviceName: "Lavagem simples",
        category: "WASH",
        durationInMinutes: 60,
        priceInCents: 30000,
      }),
      slot: TimeSlot.create({
        startsAt: new Date("2026-04-06T10:00:00"),
        endsAt: new Date("2026-04-06T11:00:00"),
      }),
      status: "SCHEDULED",
      createdAt: new Date("2026-04-01T08:00:00"),
      updatedAt: new Date("2026-04-01T08:00:00"),
      confirmedAt: null,
      cancelledAt: null,
      expiredAt: null,
      reservationExpiresAt: null,
      ...override,
    },
    id,
  );
}
