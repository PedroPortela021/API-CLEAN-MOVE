import {
  Service,
  ServiceProps,
} from "../../modules/catalog/domain/entities/services";
import { UniqueEntityId } from "../../shared/entities/unique-entity-id";
import { EstimatedDuration } from "../../modules/catalog/domain/value-objects/estimated-duration";
import { Money } from "../../modules/catalog/domain/value-objects/money";
import { faker } from "@faker-js/faker";

export function makeService(
  override?: Partial<ServiceProps>,
  id?: UniqueEntityId,
) {
  const service = Service.create(
    {
      establishmentId: new UniqueEntityId(),
      serviceName: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      category: "WASH",
      estimatedDuration: EstimatedDuration.create({
        minInMinutes: 30,
        maxInMinutes: 60,
      }),
      price: Money.create(30000),
      ...override,
    },
    id,
  );

  return service;
}
