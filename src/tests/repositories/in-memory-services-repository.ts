import { ServicesRepository } from "../../modules/application/repositories/services-repository";
import { Service } from "../../modules/catalog/domain/entities/services";

export class InMemoryServicesRepository implements ServicesRepository {
  public items: Service[] = [];

  async create(service: Service): Promise<void> {
    this.items.push(service);
  }
}
