import { Address } from "../../../accounts/domain/value-objects/address";
import { Email } from "../../../accounts/domain/value-objects/email";
import { Phone } from "../../../accounts/domain/value-objects/phone";
import { NotAllowedError } from "../../../../shared/errors/not-allowed-error";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { makeUser } from "../../../../../tests/factories/user-factory";
import { InMemoryUsersRepository } from "../../../../../tests/repositories/in-memory-users-repository";
import { CompleteUserProfileUseCase } from "./complete-user-profile";

let inMemoryUsersRepository: InMemoryUsersRepository;

let sut: CompleteUserProfileUseCase;

describe("Complete user profile", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();

    sut = new CompleteUserProfileUseCase(inMemoryUsersRepository);
  });

  it("should fill phone and address when profile is incomplete", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("incomplete@example.com"),
      hashedPassword: null,
      phone: null,
      address: null,
    });

    await inMemoryUsersRepository.create(user);

    const phone = Phone.create("11987654321");
    const address = Address.create({
      city: "São Paulo",
      country: "BR",
      state: "SP",
      street: "Rua A",
      zipCode: "01310-100",
    });

    const result = await sut.execute({
      userId: user.id.toString(),
      phone,
      address,
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.user.isProfileComplete()).toBe(true);
    expect(result.value.user.phone).toBe(phone);
    expect(result.value.user.address).toBe(address);
  });

  it("should not allow completing an already complete profile", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("complete@example.com"),
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      phone: Phone.create("11987654321"),
      address: Address.create({
        city: "São Paulo",
        country: "BR",
        state: "SP",
        street: "Rua B",
        zipCode: "01310-200",
      }),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });

  it("should reject unknown user id", async () => {
    const result = await sut.execute({
      userId: "unknown-id",
      phone: Phone.create("11987654321"),
      address: Address.create({
        city: "São Paulo",
        country: "BR",
        state: "SP",
        street: "Rua C",
        zipCode: "01310-300",
      }),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
