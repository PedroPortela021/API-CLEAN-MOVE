import {
  Establishment,
  EstablishmentProps,
} from "../../modules/establishments/domain/entities/establishment";
import { Cnpj } from "../../modules/establishments/domain/value-objects/cnpj";
import { OperatingHours } from "../../modules/establishments/domain/value-objects/operating-hours";
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
      operatingHours: OperatingHours.create({
        days: [
          {
            day: "MONDAY",
            ranges: [{ start: "08:00", end: "18:00" }],
          },
          {
            day: "SATURDAY",
            ranges: [{ start: "08:00", end: "12:00" }],
          },
          {
            day: "SUNDAY",
            ranges: [],
          },
        ],
      }),
      ...override,
    },
    id,
  );

  return establishment;
}
