import {
  Establishment,
  EstablishmentProps,
} from "../../src/modules/establishments/domain/entities/establishment";
import { UniqueEntityId } from "../../src/shared/entities/unique-entity-id";
import { Cnpj } from "../../src/modules/establishments/domain/value-objects/cnpj";
import { OperatingHours } from "../../src/modules/establishments/domain/value-objects/operating-hours";
import { makeCompanyName, makeUsername } from "./random-data";
import { PrismaService } from "../../src/infra/database/prisma/prisma.service";
import { PrismaEstablishmentMapper } from "../../src/infra/database/prisma/mappers/prisma-establishment-mapper";

export function makeEstablishment(
  override?: Partial<EstablishmentProps>,
  id?: UniqueEntityId,
) {
  const establishment = Establishment.create(
    {
      ownerId: new UniqueEntityId(),
      cnpj: Cnpj.create("81936265000106"),
      socialReason: makeCompanyName(),
      corporateName: makeUsername(),
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

export class EstablishmentFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaEstablishment(
    data?: Partial<EstablishmentProps>,
    id?: UniqueEntityId,
  ) {
    const establishment = makeEstablishment(data, id);

    await this.prisma.establishment.create({
      data: PrismaEstablishmentMapper.toPrisma(establishment),
    });

    return establishment;
  }
}
