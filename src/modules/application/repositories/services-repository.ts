import { PaginationParams } from "../../../shared/types/pagination-params";
import { Service } from "../../catalog/domain/entities/services";
import { ServiceCategory } from "../../catalog/domain/value-objects/service-category";

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
}
