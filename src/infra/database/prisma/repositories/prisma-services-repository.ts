import { Injectable } from "@nestjs/common";
import { ServicesRepository } from "../../../../modules/application/repositories/services-repository";
import { ServiceCategory } from "../../../../modules/catalog/domain/value-objects/service-category";
import { Service } from "../../../../modules/catalog/domain/entities/services";
import { PrismaServiceMapper } from "../mappers/prisma-service-mapper";
import { rethrowPrismaRepositoryError } from "../prisma-repository-error-handler";
import { PrismaUnitOfWork } from "../prisma-unit-of-work";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaServicesRepository implements ServicesRepository {
  constructor(private prisma: PrismaService) {}

  async create(service: Service): Promise<void> {
    const data = PrismaServiceMapper.toPrisma(service);

    try {
      await PrismaUnitOfWork.getClient(this.prisma).service.create({
        data,
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findManyByEstablishmentId(
    establishmentId: string,
    filters?: {
      serviceName?: string;
      category?: ServiceCategory;
      minPrice?: number;
      maxPrice?: number;
      page?: number;
      size?: number;
    },
  ): Promise<Service[]> {
    const page = filters?.page ?? 1;
    const size = filters?.size ?? 20;

    try {
      const services = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).service.findMany({
        where: {
          establishmentId,
          ...(filters?.serviceName ? { serviceName: filters.serviceName } : {}),
          ...(filters?.category ? { category: filters.category } : {}),
          ...(filters?.minPrice !== undefined || filters?.maxPrice !== undefined
            ? {
                priceInCents: {
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

      return services.map((service) => PrismaServiceMapper.toDomain(service));
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findById(id: string): Promise<Service | null> {
    try {
      const service = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).service.findUnique({
        where: {
          id,
        },
      });

      if (!service) {
        return null;
      }

      return PrismaServiceMapper.toDomain(service);
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findByServiceIdAndEstablishmentId(
    serviceId: string,
    establishmentId: string,
  ): Promise<Service | null> {
    try {
      const service = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).service.findFirst({
        where: {
          id: serviceId,
          establishmentId,
        },
      });

      if (!service) {
        return null;
      }

      return PrismaServiceMapper.toDomain(service);
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async save(service: Service): Promise<void> {
    const data = PrismaServiceMapper.toPrismaUpdate(service);

    try {
      await PrismaUnitOfWork.getClient(this.prisma).service.update({
        where: {
          id: service.id.toString(),
        },
        data,
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findMany(): Promise<Service[]> {
    try {
      const services = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).service.findMany({
        orderBy: {
          createdAt: "asc",
        },
      });

      return services.map((service) => PrismaServiceMapper.toDomain(service));
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }
}
