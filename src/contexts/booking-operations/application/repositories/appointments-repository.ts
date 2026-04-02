import {
  Appointment,
  AppointmentStatus,
} from "../../domain/scheduling/entities/appointment";

export type AppointmentFilters = {
  serviceName?: string;
  status?: AppointmentStatus;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
};

export abstract class AppointmentsRepository {
  abstract create(appointment: Appointment): Promise<void>;
  abstract findById(id: string): Promise<Appointment | null>;
  abstract findManyByEstablishmentId(
    establishmentId: string,
    filters?: AppointmentFilters,
  ): Promise<Appointment[]>;
  abstract findManyByEstablishmentIdAndInterval(
    establishmentId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment[] | null>;
  abstract save(appointment: Appointment): Promise<void>;
}
