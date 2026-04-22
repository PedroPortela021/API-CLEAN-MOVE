import { Injectable } from "@nestjs/common";
import {
  AppointmentFilters,
  AppointmentsRepository,
} from "../../../../modules/application/repositories/appointments-repository";
import { Appointment } from "../../../../modules/scheduling/domain/entities/appointment";
import { PrismaAppointmentMapper } from "../mappers/prisma-appointment-mapper";
import { rethrowPrismaRepositoryError } from "../prisma-repository-error-handler";
import { PrismaUnitOfWork } from "../prisma-unit-of-work";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaAppointmentsRepository implements AppointmentsRepository {
  constructor(private prisma: PrismaService) {}

  async create(appointment: Appointment): Promise<void> {
    const data = PrismaAppointmentMapper.toPrisma(appointment);

    try {
      await PrismaUnitOfWork.getClient(this.prisma).appointment.create({
        data,
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findById(id: string): Promise<Appointment | null> {
    try {
      const appointment = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).appointment.findUnique({
        where: {
          id,
        },
      });

      if (!appointment) {
        return null;
      }

      return PrismaAppointmentMapper.toDomain(appointment);
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findManyByEstablishmentId(
    establishmentId: string,
    filters?: Omit<AppointmentFilters, "establishmentName">,
  ): Promise<Appointment[]> {
    const page = filters?.page ?? 1;
    const size = filters?.size ?? 20;

    try {
      const appointments = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).appointment.findMany({
        where: {
          establishmentId,
          ...(filters?.serviceName
            ? { bookedServiceName: filters.serviceName }
            : {}),
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.category
            ? { bookedServiceCategory: filters.category }
            : {}),
          ...(filters?.minPrice !== undefined || filters?.maxPrice !== undefined
            ? {
                bookedServicePriceInCents: {
                  ...(filters.minPrice !== undefined
                    ? { gte: filters.minPrice }
                    : {}),
                  ...(filters.maxPrice !== undefined
                    ? { lte: filters.maxPrice }
                    : {}),
                },
              }
            : {}),
        },
        orderBy: {
          createdAt: "asc",
        },
        skip: (page - 1) * size,
        take: size,
      });

      return appointments.map((appointment) =>
        PrismaAppointmentMapper.toDomain(appointment),
      );
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findManyByEstablishmentIdAndInterval(
    establishmentId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment[] | null> {
    try {
      const appointments = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).appointment.findMany({
        where: {
          establishmentId,
          startsAt: {
            lt: endsAt,
          },
          endsAt: {
            gt: startsAt,
          },
        },
        orderBy: {
          startsAt: "asc",
        },
      });

      if (appointments.length === 0) {
        return null;
      }

      return appointments.map((appointment) =>
        PrismaAppointmentMapper.toDomain(appointment),
      );
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findManyByCustomerId(
    customerId: string,
    filters?: AppointmentFilters,
  ): Promise<Appointment[]> {
    const page = filters?.page ?? 1;
    const size = filters?.size ?? 20;

    try {
      const appointments = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).appointment.findMany({
        where: {
          customerId,
          ...(filters?.serviceName
            ? { bookedServiceName: filters.serviceName }
            : {}),
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.category
            ? { bookedServiceCategory: filters.category }
            : {}),
          ...(filters?.minPrice !== undefined || filters?.maxPrice !== undefined
            ? {
                bookedServicePriceInCents: {
                  ...(filters.minPrice !== undefined
                    ? { gte: filters.minPrice }
                    : {}),
                  ...(filters.maxPrice !== undefined
                    ? { lte: filters.maxPrice }
                    : {}),
                },
              }
            : {}),
          ...(filters?.establishmentName
            ? {
                establishment: {
                  is: {
                    corporateName: filters.establishmentName,
                  },
                },
              }
            : {}),
        },
        orderBy: {
          createdAt: "asc",
        },
        skip: (page - 1) * size,
        take: size,
      });

      return appointments.map((appointment) =>
        PrismaAppointmentMapper.toDomain(appointment),
      );
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async save(appointment: Appointment): Promise<void> {
    const data = PrismaAppointmentMapper.toPrismaUpdate(appointment);

    try {
      await PrismaUnitOfWork.getClient(this.prisma).appointment.update({
        where: {
          id: appointment.id.toString(),
        },
        data,
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }
}
