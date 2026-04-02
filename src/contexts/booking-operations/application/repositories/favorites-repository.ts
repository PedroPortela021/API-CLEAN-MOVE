import { FavoriteEstablishment } from "../../domain/customer/entities/favorite-establishment";

export abstract class FavoritesRepository {
  abstract create(favorite: FavoriteEstablishment): Promise<void>;
  abstract delete(favorite: FavoriteEstablishment): Promise<void>;
  abstract findByCustomerAndEstablishment(
    customerId: string,
    establishmentId: string,
  ): Promise<FavoriteEstablishment | null>;
  abstract listByCustomerId(
    customerId: string,
  ): Promise<FavoriteEstablishment[]>;
}
