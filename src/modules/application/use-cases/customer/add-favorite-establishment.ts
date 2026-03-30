import { Either, left, right } from "../../../../shared/either";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { ResourceAlreadyExistsError } from "../../../../shared/errors/resource-already-exists-error";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { FavoriteEstablishment } from "../../../customer/domain/entities/favorite-establishment";
import { CustomersRepository } from "../../repositories/customers-repository";
import { EstablishmentsRepository } from "../../repositories/establishment-repository";
import { FavoritesRepository } from "../../repositories/favorites-repository";

type AddFavoriteEstablishmentUseCaseRequest = {
  customerId: string;
  establishmentId: string;
};

type AddFavoriteEstablishmentUseCaseResponse = Either<
  ResourceNotFoundError | ResourceAlreadyExistsError,
  {
    favorite: FavoriteEstablishment;
  }
>;

export class AddFavoriteEstablishmentUseCase {
  constructor(
    private customersRepository: CustomersRepository,
    private establishmentsRepository: EstablishmentsRepository,
    private favoritesRepository: FavoritesRepository,
  ) {}

  async execute({
    customerId,
    establishmentId,
  }: AddFavoriteEstablishmentUseCaseRequest): Promise<AddFavoriteEstablishmentUseCaseResponse> {
    const [customer, establishment, existingFavorite] = await Promise.all([
      this.customersRepository.findById(customerId),
      this.establishmentsRepository.findById(establishmentId),
      this.favoritesRepository.findByCustomerAndEstablishment(
        customerId,
        establishmentId,
      ),
    ]);

    if (!customer) {
      return left(new ResourceNotFoundError("Customer not found."));
    }

    if (!establishment) {
      return left(new ResourceNotFoundError("Establishment not found."));
    }

    if (existingFavorite) {
      return left(
        new ResourceAlreadyExistsError("Establishment already in favorites."),
      );
    }

    const favorite = FavoriteEstablishment.create({
      customerId: new UniqueEntityId(customerId),
      establishmentId: new UniqueEntityId(establishmentId),
    });

    await this.favoritesRepository.create(favorite);

    return right({
      favorite,
    });
  }
}
