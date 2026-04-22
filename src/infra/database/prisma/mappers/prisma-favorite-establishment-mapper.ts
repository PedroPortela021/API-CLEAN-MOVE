import {
  FavoriteEstablishment as PrismaFavoriteEstablishment,
  Prisma,
} from "../../../../generated/prisma/browser";
import { FavoriteEstablishment } from "../../../../modules/customer/domain/entities/favorite-establishment";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";

export class PrismaFavoriteEstablishmentMapper {
  static toDomain(raw: PrismaFavoriteEstablishment): FavoriteEstablishment {
    return FavoriteEstablishment.create(
      {
        customerId: new UniqueEntityId(raw.customerId),
        establishmentId: new UniqueEntityId(raw.establishmentId),
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(
    raw: FavoriteEstablishment,
  ): Prisma.FavoriteEstablishmentUncheckedCreateInput {
    return {
      id: raw.id.toString(),
      customerId: raw.customerId.toString(),
      establishmentId: raw.establishmentId.toString(),
      createdAt: raw.createdAt,
    };
  }
}
