import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { makeCustomer } from "../../../../../tests/factories/customer-factory";
import { makeEstablishment } from "../../../../../tests/factories/establishment-factory";
import { InMemoryCustomersRepository } from "../../../../../tests/repositories/in-memory-customers-repository";
import { InMemoryEstablishmentsRepository } from "../../../../../tests/repositories/in-memory-establishment-repository";
import { InMemoryFavoritesRepository } from "../../../../../tests/repositories/in-memory-favorites-repository";
import { AddFavoriteEstablishmentUseCase } from "./add-favorite-establishment";
import { RemoveFavoriteEstablishmentUseCase } from "./remove-favorite-establishment";

let inMemoryCustomersRepository: InMemoryCustomersRepository;
let inMemoryEstablishmentsRepository: InMemoryEstablishmentsRepository;
let inMemoryFavoritesRepository: InMemoryFavoritesRepository;
let addFavoriteUseCase: AddFavoriteEstablishmentUseCase;
let sut: RemoveFavoriteEstablishmentUseCase;

describe("Remove favorite establishment", () => {
  beforeEach(() => {
    inMemoryCustomersRepository = new InMemoryCustomersRepository();
    inMemoryEstablishmentsRepository = new InMemoryEstablishmentsRepository();
    inMemoryFavoritesRepository = new InMemoryFavoritesRepository();

    addFavoriteUseCase = new AddFavoriteEstablishmentUseCase(
      inMemoryCustomersRepository,
      inMemoryEstablishmentsRepository,
      inMemoryFavoritesRepository,
    );

    sut = new RemoveFavoriteEstablishmentUseCase(
      inMemoryCustomersRepository,
      inMemoryFavoritesRepository,
    );
  });

  it("should be able to remove a favorite establishment", async () => {
    const customer = makeCustomer();
    const establishment = makeEstablishment();

    await inMemoryCustomersRepository.create(customer);
    await inMemoryEstablishmentsRepository.create(establishment);

    await addFavoriteUseCase.execute({
      customerId: customer.id.toString(),
      establishmentId: establishment.id.toString(),
    });

    const result = await sut.execute({
      customerId: customer.id.toString(),
      establishmentId: establishment.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(inMemoryFavoritesRepository.items).toHaveLength(0);
  });

  it("should not be able to remove unknown favorite", async () => {
    const customer = makeCustomer();

    await inMemoryCustomersRepository.create(customer);

    const result = await sut.execute({
      customerId: customer.id.toString(),
      establishmentId: "unknown-establishment",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
