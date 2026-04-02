import { ServiceCategory } from "../../catalog/domain/value-objects/service-category";
import { Establishment } from "../../establishments/domain/entities/establishment";

export abstract class EstablishmentsRepository {
  abstract create(data: Establishment): Promise<void>;
  abstract findById(id: string): Promise<Establishment | null>;
  abstract findByCnpj(cnpj: string): Promise<Establishment | null>;
  abstract findBySlug(slug: string): Promise<Establishment | null>;
  abstract findBySlugAndCnpj(
    cnpj: string,
    slug: string,
  ): Promise<Establishment | null>;
  abstract findMany(filters?: {
    establishmentName?: string;
    serviceCategory?: ServiceCategory;
  }): Promise<Establishment[]>;
}
