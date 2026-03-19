import {
  Establishment,
  EstablishmentProps,
} from "../../modules/establishments/domain/entities/establishment";
import { Cnpj } from "../../modules/establishments/domain/value-objects/cnpj";
import { UniqueEntityId } from "../../shared/entities/unique-entity-id";
import { faker } from "@faker-js/faker";

export function makeEstablishment(
  override?: Partial<EstablishmentProps>,
  id?: UniqueEntityId,
) {
  const establishment = Establishment.create(
    {
      ownerId: new UniqueEntityId(),
      cnpj: Cnpj.create("81936265000106"),
      socialReason: faker.company.name(),
      corporateName: faker.internet.username(),
      ...override,
    },
    id,
  );

  return establishment;
}
