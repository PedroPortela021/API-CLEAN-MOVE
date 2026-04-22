import { Injectable } from "@nestjs/common";
import { FavoritesRepository } from "../../../../modules/application/repositories/favorites-repository";
import { FavoriteEstablishment } from "../../../../modules/customer/domain/entities/favorite-establishment";
import { PrismaFavoriteEstablishmentMapper } from "../mappers/prisma-favorite-establishment-mapper";
import { PrismaUnitOfWork } from "../prisma-unit-of-work";
import { rethrowPrismaRepositoryError } from "../prisma-repository-error-handler";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaFavoritesRepository implements FavoritesRepository {
  constructor(private prisma: PrismaService) {}

  async create(favorite: FavoriteEstablishment): Promise<void> {
    const data = PrismaFavoriteEstablishmentMapper.toPrisma(favorite);

    try {
      await PrismaUnitOfWork.getClient(
        this.prisma,
      ).favoriteEstablishment.create({
        data,
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async delete(favorite: FavoriteEstablishment): Promise<void> {
    try {
      await PrismaUnitOfWork.getClient(
        this.prisma,
      ).favoriteEstablishment.deleteMany({
        where: {
          customerId: favorite.customerId.toString(),
          establishmentId: favorite.establishmentId.toString(),
        },
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findByCustomerAndEstablishment(
    customerId: string,
    establishmentId: string,
  ): Promise<FavoriteEstablishment | null> {
    try {
      const favorite = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).favoriteEstablishment.findUnique({
        where: {
          customerId_establishmentId: {
            customerId,
            establishmentId,
          },
        },
      });

      if (!favorite) {
        return null;
      }

      return PrismaFavoriteEstablishmentMapper.toDomain(favorite);
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async listByCustomerId(customerId: string): Promise<FavoriteEstablishment[]> {
    try {
      const favorites = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).favoriteEstablishment.findMany({
        where: {
          customerId,
        },
      });

      return favorites.map((favorite) =>
        PrismaFavoriteEstablishmentMapper.toDomain(favorite),
      );
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }
}
