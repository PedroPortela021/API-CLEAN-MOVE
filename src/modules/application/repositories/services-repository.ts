import { Service } from "../../catalog/domain/entities/services";

export abstract class ServicesRepository {
  abstract create(service: Service): Promise<void>;
}
