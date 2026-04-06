import {
  AppointmentFilters,
  AppointmentsRepository,
} from "../../src/modules/application/repositories/appointments-repository";
import { Appointment } from "../../src/modules/scheduling/domain/entities/appointment";
import { TimeSlot } from "../../src/modules/scheduling/domain/value-objects/time-slot";
import { InMemoryEstablishmentsRepository } from "./in-memory-establishment-repository";

export class InMemoryAppointmentsRepository implements AppointmentsRepository {
  public items: Appointment[] = [];

  constructor(
    private establishmentsRepository?: InMemoryEstablishmentsRepository,
  ) {}

  async create(appointment: Appointment): Promise<void> {
    this.items.push(appointment);
  }

  async findById(id: string): Promise<Appointment | null> {
    const appointment = this.items.find((item) => item.id.toString() === id);

    if (!appointment) {
      return null;
    }

    return appointment;
  }

  async findManyByEstablishmentId(
    establishmentId: string,
    filters?: Omit<AppointmentFilters, "establishmentName">,
  ): Promise<Appointment[]> {
    const page = filters?.page ?? 1;
    const size = filters?.size ?? 20;

    const filteredAppointments = this.items
      .slice()
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime())
      .filter((item) => item.establishmentId.toString() === establishmentId)
      .filter((item) => {
        if (
          filters?.serviceName &&
          item.service.serviceName !== filters.serviceName
        ) {
          return false;
        }

        if (filters?.status && item.status !== filters.status) {
          return false;
        }

        if (filters?.category && item.service.category !== filters.category) {
          return false;
        }

        if (
          filters?.minPrice !== undefined &&
          item.service.priceInCents < filters.minPrice
        ) {
          return false;
        }

        if (
          filters?.maxPrice !== undefined &&
          item.service.priceInCents > filters.maxPrice
        ) {
          return false;
        }

        return true;
      });

    const start = (page - 1) * size;
    const end = start + size;

    return filteredAppointments.slice(start, end);
  }

  async findManyByEstablishmentIdAndInterval(
    establishmentId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment[] | null> {
    const targetSlot = TimeSlot.create({ startsAt, endsAt });

    const appointments = this.items
      .filter(
        (item) =>
          item.establishmentId.toString() === establishmentId &&
          item.slot.overlapsWith(targetSlot),
      )
      .sort((a, b) => a.slot.startsAt.getTime() - b.slot.startsAt.getTime());

    return appointments.length > 0 ? appointments : null;
  }

  async findManyByCustomerId(
    customerId: string,
    filters?: AppointmentFilters,
  ): Promise<Appointment[]> {
    const page = filters?.page ?? 1;
    const size = filters?.size ?? 20;

    let allowedEstablishmentIds: Set<string> | null = null;

    if (filters?.establishmentName) {
      if (!this.establishmentsRepository) {
        return [];
      }

      allowedEstablishmentIds = new Set(
        (
          await this.establishmentsRepository.findMany({
            establishmentName: filters.establishmentName,
          })
        ).map((establishment) => establishment.id.toString()),
      );
    }

    const filteredAppointments = this.items
      .slice()
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime())
      .filter((item) => item.customerId.toString() === customerId)
      .filter((item) => {
        if (
          allowedEstablishmentIds &&
          !allowedEstablishmentIds.has(item.establishmentId.toString())
        ) {
          return false;
        }

        if (
          filters?.serviceName &&
          item.service.serviceName !== filters.serviceName
        ) {
          return false;
        }

        if (filters?.status && item.status !== filters.status) {
          return false;
        }

        if (filters?.category && item.service.category !== filters.category) {
          return false;
        }

        if (
          filters?.minPrice !== undefined &&
          item.service.priceInCents < filters.minPrice
        ) {
          return false;
        }

        if (
          filters?.maxPrice !== undefined &&
          item.service.priceInCents > filters.maxPrice
        ) {
          return false;
        }

        return true;
      });

    const start = (page - 1) * size;
    const end = start + size;

    return filteredAppointments.slice(start, end);
  }

  async save(appointment: Appointment): Promise<void> {
    const appointmentIndex = this.items.findIndex((item) =>
      item.id.equals(appointment.id),
    );

    if (appointmentIndex === -1) {
      this.items.push(appointment);
      return;
    }

    this.items[appointmentIndex] = appointment;
  }
}
