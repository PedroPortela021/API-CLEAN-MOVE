import { ServicesRepository } from "../../src/modules/application/repositories/services-repository";
import { Service } from "../../src/modules/catalog/domain/entities/services";
import { ServiceCategory } from "../../src/modules/catalog/domain/value-objects/service-category";

export class InMemoryServicesRepository implements ServicesRepository {
  public items: Service[] = [];

  async create(service: Service): Promise<void> {
    this.items.push(service);
  }

  async findById(id: string): Promise<Service | null> {
    const service = this.items.find((item) => item.id.toString() === id);

    if (!service) {
      return null;
    }

    return service;
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

    const filteredServices = this.items
      .filter((item) => item.establishmentId.toString() === establishmentId)
      .filter((item) => {
        if (
          filters?.serviceName &&
          item.serviceName.toString() !== filters.serviceName
        ) {
          return false;
        }

        if (filters?.category && item.category !== filters.category) {
          return false;
        }

        if (
          filters?.minPrice !== undefined &&
          item.price.amountInCents < filters.minPrice
        ) {
          return false;
        }

        if (
          filters?.maxPrice !== undefined &&
          item.price.amountInCents > filters.maxPrice
        ) {
          return false;
        }

        return true;
      });

    const start = (page - 1) * size;
    const end = start + size;

    return filteredServices.slice(start, end);
  }

  async findByServiceIdAndEstablishmentId(
    serviceId: string,
    establishmentId: string,
  ): Promise<Service | null> {
    const service = this.items.find(
      (item) =>
        item.id.toString() === serviceId &&
        item.establishmentId.toString() === establishmentId,
    );

    if (!service) return null;

    return service;
  }

  async save(service: Service): Promise<void> {
    const serviceIndex = this.items.findIndex((item) =>
      item.id.equals(service.id),
    );

    if (serviceIndex === -1) {
      this.items.push(service);
      return;
    }

    this.items[serviceIndex] = service;
  }

  async findMany(): Promise<Service[]> {
    const services = this.items;

    return services;
  }
}
