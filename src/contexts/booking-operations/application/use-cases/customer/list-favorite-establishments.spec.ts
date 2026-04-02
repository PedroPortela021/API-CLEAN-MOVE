import { ResourceNotFoundError } from "../../../../../shared/errors/resource-not-found-error";
import { makeCustomer } from "../../../../../tests/factories/customer-factory";
import { makeEstablishment } from "../../../../../tests/factories/establishment-factory";
import { InMemoryCustomersRepository } from "../../../../../tests/repositories/in-memory-customers-repository";
import { InMemoryEstablishmentsRepository } from "../../../../../tests/repositories/in-memory-establishment-repository";
import { InMemoryFavoritesRepository } from "../../../../../tests/repositories/in-memory-favorites-repository";
import { AddFavoriteEstablishmentUseCase } from "./add-favorite-establishment";
import { ListFavoriteEstablishmentsUseCase } from "./list-favorite-establishments";

let inMemoryCustomersRepository: InMemoryCustomersRepository;
let inMemoryEstablishmentsRepository: InMemoryEstablishmentsRepository;
let inMemoryFavoritesRepository: InMemoryFavoritesRepository;
let addFavoriteUseCase: AddFavoriteEstablishmentUseCase;
let sut: ListFavoriteEstablishmentsUseCase;

describe("List favorite establishments", () => {
  beforeEach(() => {
    inMemoryCustomersRepository = new InMemoryCustomersRepository();
    inMemoryEstablishmentsRepository = new InMemoryEstablishmentsRepository();
    inMemoryFavoritesRepository = new InMemoryFavoritesRepository();

    addFavoriteUseCase = new AddFavoriteEstablishmentUseCase(
      inMemoryCustomersRepository,
      inMemoryEstablishmentsRepository,
      inMemoryFavoritesRepository,
    );

    sut = new ListFavoriteEstablishmentsUseCase(
      inMemoryCustomersRepository,
      inMemoryFavoritesRepository,
    );
  });

  it("should be able to list customer favorites", async () => {
    const customer = makeCustomer();
    const establishmentA = makeEstablishment();
    const establishmentB = makeEstablishment();

    await inMemoryCustomersRepository.create(customer);
    await inMemoryEstablishmentsRepository.create(establishmentA);
    await inMemoryEstablishmentsRepository.create(establishmentB);

    await addFavoriteUseCase.execute({
      customerId: customer.id.toString(),
      establishmentId: establishmentA.id.toString(),
    });

    await addFavoriteUseCase.execute({
      customerId: customer.id.toString(),
      establishmentId: establishmentB.id.toString(),
    });

    const result = await sut.execute({
      customerId: customer.id.toString(),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.favorites).toHaveLength(2);
  });

  it("should not be able to list favorites for unknown customer", async () => {
    const result = await sut.execute({
      customerId: "unknown-customer",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
