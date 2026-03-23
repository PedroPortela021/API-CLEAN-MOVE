import { Establishment } from "../../establishments/domain/entities/establishment";

export abstract class EstablishmentsRepository {
  abstract create(data: Establishment): Promise<void>;
  abstract findByCnpj(cnpj: string): Promise<Establishment | null>;
  abstract findBySlug(slug: string): Promise<Establishment | null>;
  abstract findBySlugAndCnpj(
    cnpj: string,
    slug: string,
  ): Promise<Establishment | null>;
}
