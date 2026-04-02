import { Either, left, right } from "../../../../../shared/either";
import { ResourceNotFoundError } from "../../../../../shared/errors/resource-not-found-error";
import { FavoriteEstablishment } from "../../../domain/customer/entities/favorite-establishment";
import { CustomersRepository } from "../../repositories/customers-repository";
import { FavoritesRepository } from "../../repositories/favorites-repository";

type ListFavoriteEstablishmentsUseCaseRequest = {
  customerId: string;
};

type ListFavoriteEstablishmentsUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    favorites: FavoriteEstablishment[];
  }
>;

export class ListFavoriteEstablishmentsUseCase {
  constructor(
    private customersRepository: CustomersRepository,
    private favoritesRepository: FavoritesRepository,
  ) {}

  async execute({
    customerId,
  }: ListFavoriteEstablishmentsUseCaseRequest): Promise<ListFavoriteEstablishmentsUseCaseResponse> {
    const customer = await this.customersRepository.findById(customerId);

    if (!customer) {
      return left(new ResourceNotFoundError({ resource: "customer" }));
    }

    const favorites =
      await this.favoritesRepository.listByCustomerId(customerId);

    return right({
      favorites,
    });
  }
}
