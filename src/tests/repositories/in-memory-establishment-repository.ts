import { EstablishmentsRepository } from "../../modules/application/repositories/establishment-repository";
import { Establishment } from "../../modules/establishments/domain/entities/establishment";

export class InMemoryEstablishmentsRepository implements EstablishmentsRepository {
  public items: Establishment[] = [];

  async create(data: Establishment): Promise<void> {
    this.items.push(data);
  }

  async findByCnpj(cnpj: string): Promise<Establishment | null> {
    const establishment = this.items.find(
      (item) => item.cnpj.toString() === cnpj,
    );

    if (!establishment) {
      return null;
    }

    return establishment;
  }

  async findBySlug(slug: string): Promise<Establishment | null> {
    const establishment = this.items.find(
      (item) => item.slug.toString() === slug,
    );

    if (!establishment) {
      return null;
    }

    return establishment;
  }

  async findBySlugAndCnpj(cnpj: string, slug: string) {
    const establishment = this.items.find(
      (item) => item.cnpj.value === cnpj || item.slug.value === slug,
    );

    if (!establishment) return null;

    return establishment;
  }
}
