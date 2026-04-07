import {
  Service,
  ServiceProps,
} from "../../src/modules/catalog/domain/entities/services";
import { UniqueEntityId } from "../../src/shared/entities/unique-entity-id";
import { EstimatedDuration } from "../../src/modules/catalog/domain/value-objects/estimated-duration";
import { Money } from "../../src/modules/catalog/domain/value-objects/money";
import { ServiceName } from "../../src/modules/catalog/domain/value-objects/service-name";
import { makeProductDescription, makeProductName } from "./random-data";

export function makeService(
  override?: Partial<ServiceProps>,
  id?: UniqueEntityId,
) {
  const service = Service.create(
    {
      establishmentId: new UniqueEntityId(),
      serviceName: ServiceName.create(makeProductName()),
      description: makeProductDescription(),
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
