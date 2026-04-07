import { ServiceCategory } from "../../catalog/domain/value-objects/service-category";
import {
  Appointment,
  AppointmentStatus,
} from "../../scheduling/domain/entities/appointment";

export type AppointmentFilters = {
  establishmentName?: string;
  category?: ServiceCategory;
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
    filters?: Omit<AppointmentFilters, "establishmentName">,
  ): Promise<Appointment[]>;
  abstract findManyByEstablishmentIdAndInterval(
    establishmentId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment[] | null>;
  abstract findManyByCustomerId(
    customerId: string,
    filters?: AppointmentFilters,
  ): Promise<Appointment[]>;
  abstract save(appointment: Appointment): Promise<void>;
}
