import {
  Appointment as PrismaAppointmentRecord,
  Prisma,
} from "../../../../generated/prisma/client";
import { Appointment } from "../../../../modules/scheduling/domain/entities/appointment";
import { BookedServiceSnapshot } from "../../../../modules/scheduling/domain/value-objects/booked-service-snapshot";
import { TimeSlot } from "../../../../modules/scheduling/domain/value-objects/time-slot";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";

export class PrismaAppointmentMapper {
  static toDomain(raw: PrismaAppointmentRecord): Appointment {
    return Appointment.create(
      {
        establishmentId: new UniqueEntityId(raw.establishmentId),
        customerId: new UniqueEntityId(raw.customerId),
        bookedByCustomer: raw.bookedByCustomer,
        service: BookedServiceSnapshot.create({
          serviceId: new UniqueEntityId(raw.bookedServiceId),
          serviceName: raw.bookedServiceName,
          category: raw.bookedServiceCategory ?? undefined,
          durationInMinutes: raw.bookedServiceDurationInMinutes ?? undefined,
          priceInCents: raw.bookedServicePriceInCents,
        }),
        slot: TimeSlot.create({
          startsAt: raw.startsAt,
          endsAt: raw.endsAt,
        }),
        status: raw.status,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        confirmedAt: raw.confirmedAt,
        cancelledAt: raw.cancelledAt,
        expiredAt: raw.expiredAt,
        reservationExpiresAt: raw.reservationExpiresAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(raw: Appointment): Prisma.AppointmentUncheckedCreateInput {
    return {
      id: raw.id.toString(),
      establishmentId: raw.establishmentId.toString(),
      customerId: raw.customerId.toString(),
      bookedByCustomer: raw.bookedByCustomer,
      bookedServiceId: raw.service.serviceId.toString(),
      bookedServiceName: raw.service.serviceName,
      bookedServiceCategory: raw.service.category ?? null,
      bookedServiceDurationInMinutes: raw.service.durationInMinutes ?? null,
      bookedServicePriceInCents: raw.service.priceInCents,
      startsAt: raw.slot.startsAt,
      endsAt: raw.slot.endsAt,
      status: raw.status,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
      confirmedAt: raw.confirmedAt,
      cancelledAt: raw.cancelledAt,
      expiredAt: raw.expiredAt,
      reservationExpiresAt: raw.reservationExpiresAt,
    };
  }

  static toPrismaUpdate(
    raw: Appointment,
  ): Prisma.AppointmentUncheckedUpdateInput {
    return {
      bookedByCustomer: raw.bookedByCustomer,
      bookedServiceId: raw.service.serviceId.toString(),
      bookedServiceName: raw.service.serviceName,
      bookedServiceCategory: raw.service.category ?? null,
      bookedServiceDurationInMinutes: raw.service.durationInMinutes ?? null,
      bookedServicePriceInCents: raw.service.priceInCents,
      startsAt: raw.slot.startsAt,
      endsAt: raw.slot.endsAt,
      status: raw.status,
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
      confirmedAt: raw.confirmedAt,
      cancelledAt: raw.cancelledAt,
      expiredAt: raw.expiredAt,
      reservationExpiresAt: raw.reservationExpiresAt,
    };
  }
}
