import { ResourceAlreadyExistsError } from "../../../../shared/errors/resource-already-exists-error";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { makeCustomer } from "../../../../../tests/factories/customer-factory";
import { makeEstablishment } from "../../../../../tests/factories/establishment-factory";
import { InMemoryCustomersRepository } from "../../../../../tests/repositories/in-memory-customers-repository";
import { InMemoryEstablishmentsRepository } from "../../../../../tests/repositories/in-memory-establishment-repository";
import { InMemoryFavoritesRepository } from "../../../../../tests/repositories/in-memory-favorites-repository";
import { AddFavoriteEstablishmentUseCase } from "./add-favorite-establishment";

let inMemoryCustomersRepository: InMemoryCustomersRepository;
let inMemoryEstablishmentsRepository: InMemoryEstablishmentsRepository;
let inMemoryFavoritesRepository: InMemoryFavoritesRepository;
let sut: AddFavoriteEstablishmentUseCase;

describe("Add favorite establishment", () => {
  beforeEach(() => {
    inMemoryCustomersRepository = new InMemoryCustomersRepository();
    inMemoryEstablishmentsRepository = new InMemoryEstablishmentsRepository();
    inMemoryFavoritesRepository = new InMemoryFavoritesRepository();

    sut = new AddFavoriteEstablishmentUseCase(
      inMemoryCustomersRepository,
      inMemoryEstablishmentsRepository,
      inMemoryFavoritesRepository,
    );
  });

  it("should be able to add an establishment to customer favorites", async () => {
    const customer = makeCustomer();
    const establishment = makeEstablishment();

    await inMemoryCustomersRepository.create(customer);
    await inMemoryEstablishmentsRepository.create(establishment);

    const result = await sut.execute({
      customerId: customer.id.toString(),
      establishmentId: establishment.id.toString(),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(inMemoryFavoritesRepository.items).toHaveLength(1);
    expect(result.value.favorite.customerId.toString()).toBe(
      customer.id.toString(),
    );
    expect(result.value.favorite.establishmentId.toString()).toBe(
      establishment.id.toString(),
    );
  });

  it("should not be able to add duplicated favorite for the same customer and establishment", async () => {
    const customer = makeCustomer();
    const establishment = makeEstablishment();

    await inMemoryCustomersRepository.create(customer);
    await inMemoryEstablishmentsRepository.create(establishment);

    await sut.execute({
      customerId: customer.id.toString(),
      establishmentId: establishment.id.toString(),
    });

    const result = await sut.execute({
      customerId: customer.id.toString(),
      establishmentId: establishment.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceAlreadyExistsError);
    expect(inMemoryFavoritesRepository.items).toHaveLength(1);
  });

  it("should not be able to add favorite for unknown customer", async () => {
    const establishment = makeEstablishment();

    await inMemoryEstablishmentsRepository.create(establishment);

    const result = await sut.execute({
      customerId: "unknown-customer",
      establishmentId: establishment.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(inMemoryFavoritesRepository.items).toHaveLength(0);
  });
});
