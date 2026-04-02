import { FavoritesRepository } from "../../src/modules/application/repositories/favorites-repository";
import { FavoriteEstablishment } from "../../src/modules/customer/domain/entities/favorite-establishment";

export class InMemoryFavoritesRepository implements FavoritesRepository {
  public items: FavoriteEstablishment[] = [];

  async create(favorite: FavoriteEstablishment): Promise<void> {
    this.items.push(favorite);
  }

  async delete(favorite: FavoriteEstablishment): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.equals(favorite));

    if (itemIndex < 0) return;

    this.items.splice(itemIndex, 1);
  }

  async findByCustomerAndEstablishment(
    customerId: string,
    establishmentId: string,
  ): Promise<FavoriteEstablishment | null> {
    const favorite = this.items.find(
      (item) =>
        item.customerId.toString() === customerId &&
        item.establishmentId.toString() === establishmentId,
    );

    if (!favorite) {
      return null;
    }

    return favorite;
  }

  async listByCustomerId(customerId: string): Promise<FavoriteEstablishment[]> {
    return this.items.filter(
      (item) => item.customerId.toString() === customerId,
    );
  }
}
