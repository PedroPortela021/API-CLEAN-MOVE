import { EstablishmentsRepository } from "../../modules/application/repositories/establishment-repository";
import { Establishment } from "../../modules/establishments/domain/entities/establishment";

export class InMemoryEstablishmentsRepository extends EstablishmentsRepository {
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

  async findByName(name: string): Promise<Establishment | null> {
    const establishment = this.items.find(
      (item) => item.corporateName === name,
    );

    if (!establishment) {
      return null;
    }

    return establishment;
  }
}
