import {
  Prisma,
  Service as PrismaServiceRecord,
} from "../../../../generated/prisma/client";
import { Service } from "../../../../modules/catalog/domain/entities/services";
import { EstimatedDuration } from "../../../../modules/catalog/domain/value-objects/estimated-duration";
import { Money } from "../../../../modules/catalog/domain/value-objects/money";
import { ServiceName } from "../../../../modules/catalog/domain/value-objects/service-name";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";

export class PrismaServiceMapper {
  static toDomain(raw: PrismaServiceRecord): Service {
    return Service.create(
      {
        establishmentId: new UniqueEntityId(raw.establishmentId),
        serviceName: ServiceName.create(raw.serviceName),
        description: raw.description,
        category: raw.category,
        estimatedDuration: EstimatedDuration.create({
          minInMinutes: raw.estimatedDurationMinInMinutes,
          maxInMinutes: raw.estimatedDurationMaxInMinutes,
        }),
        price: Money.create(raw.priceInCents),
        isActive: raw.isActive,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(raw: Service): Prisma.ServiceUncheckedCreateInput {
    return {
      id: raw.id.toString(),
      establishmentId: raw.establishmentId.toString(),
      serviceName: raw.serviceName.value,
      description: raw.description,
      category: raw.category,
      estimatedDurationMinInMinutes: raw.estimatedDuration.minInMinutes,
      estimatedDurationMaxInMinutes: raw.estimatedDuration.maxInMinutes,
      priceInCents: raw.price.amountInCents,
      isActive: raw.isActive,
      ...(raw.createdAt ? { createdAt: raw.createdAt } : {}),
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
    };
  }

  static toPrismaUpdate(raw: Service): Prisma.ServiceUncheckedUpdateInput {
    return {
      serviceName: raw.serviceName.value,
      description: raw.description,
      category: raw.category,
      estimatedDurationMinInMinutes: raw.estimatedDuration.minInMinutes,
      estimatedDurationMaxInMinutes: raw.estimatedDuration.maxInMinutes,
      priceInCents: raw.price.amountInCents,
      isActive: raw.isActive,
      ...(raw.updatedAt ? { updatedAt: raw.updatedAt } : {}),
    };
  }
}
