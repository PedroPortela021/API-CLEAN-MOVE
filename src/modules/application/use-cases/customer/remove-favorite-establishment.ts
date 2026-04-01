import { Either, left, right } from "../../../../shared/either";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { CustomersRepository } from "../../repositories/customers-repository";
import { FavoritesRepository } from "../../repositories/favorites-repository";

type RemoveFavoriteEstablishmentUseCaseRequest = {
  customerId: string;
  establishmentId: string;
};

type RemoveFavoriteEstablishmentUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    success: true;
  }
>;

export class RemoveFavoriteEstablishmentUseCase {
  constructor(
    private customersRepository: CustomersRepository,
    private favoritesRepository: FavoritesRepository,
  ) {}

  async execute({
    customerId,
    establishmentId,
  }: RemoveFavoriteEstablishmentUseCaseRequest): Promise<RemoveFavoriteEstablishmentUseCaseResponse> {
    const [customer, favorite] = await Promise.all([
      this.customersRepository.findById(customerId),
      this.favoritesRepository.findByCustomerAndEstablishment(
        customerId,
        establishmentId,
      ),
    ]);

    if (!customer) {
      return left(new ResourceNotFoundError({ resource: "customer" }));
    }

    if (!favorite) {
      return left(new ResourceNotFoundError({ resource: "favorite" }));
    }

    await this.favoritesRepository.delete(favorite);

    return right({
      success: true,
    });
  }
}
