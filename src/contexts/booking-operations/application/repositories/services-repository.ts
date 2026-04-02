import { PaginationParams } from "../../../../shared/types/pagination-params";
import { Service } from "../../domain/catalog/entities/services";
import { ServiceCategory } from "../../domain/catalog/value-objects/service-category";

export type ServiceFilters = {
  serviceName?: string;
  category?: ServiceCategory;
  minPrice?: number;
  maxPrice?: number;
} & PaginationParams;

export abstract class ServicesRepository {
  abstract create(service: Service): Promise<void>;
  abstract findManyByEstablishmentId(
    establishmentId: string,
    filters?: ServiceFilters,
  ): Promise<Service[]>;
  abstract findById(id: string): Promise<Service | null>;
  abstract findByServiceIdAndEstablishmentId(
    serviceId: string,
    establishmentId: string,
  ): Promise<Service | null>;
  abstract save(service: Service): Promise<void>;
}
