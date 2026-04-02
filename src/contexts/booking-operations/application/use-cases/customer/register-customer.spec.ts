import { ResourceAlreadyExistsError } from "../../../../../shared/errors/resource-already-exists-error";
import { makeCustomer } from "../../../../../tests/factories/customer-factory";
import { makeUser } from "../../../../../tests/factories/user-factory";
import { FakeHashGenerator } from "../../../../../tests/repositories/fake-hash-generator";
import { InMemoryCustomersRepository } from "../../../../../tests/repositories/in-memory-customers-repository";
import { InMemoryUsersRepository } from "../../../../../tests/repositories/in-memory-users-repository";
import { Address } from "../../../../identity-access/domain/accounts/value-objects/address";
import { Cpf } from "../../../../identity-access/domain/accounts/value-objects/cpf";
import { Email } from "../../../../identity-access/domain/accounts/value-objects/email";
import { Phone } from "../../../../identity-access/domain/accounts/value-objects/phone";
import { RegisterCustomerUseCase } from "./register-customer";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryCustomersRepository: InMemoryCustomersRepository;
let fakeHashGenerator: FakeHashGenerator;

let sut: RegisterCustomerUseCase;

describe("Register a customer", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryCustomersRepository = new InMemoryCustomersRepository();
    fakeHashGenerator = new FakeHashGenerator();

    sut = new RegisterCustomerUseCase(
      inMemoryUsersRepository,
      inMemoryCustomersRepository,
      fakeHashGenerator,
    );
  });

  it("should be able to register a customer with valid data", async () => {
    const result = await sut.execute({
      cpf: Cpf.create("529.982.247-25"),
      name: "John Doe",
      email: new Email("johndoe@example.com"),
      password: "johndoe@123",
      phone: Phone.create("11987654321"),
      address: Address.create({
        city: "city-1",
        country: "country-1",
        state: "state-1",
        street: "street-1",
        zipCode: "11111-111",
      }),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(inMemoryCustomersRepository.items[0]).toBe(result.value.customer);
    expect(inMemoryUsersRepository.items[0]?.id).toBe(
      result.value.customer.userId,
    );
    expect(inMemoryUsersRepository.items[0]?.hashedPassword).toBe(
      "johndoe@123-hashed",
    );
  });

  it("not should be able to register a customer with duplicated email", async () => {
    const createdUser = makeUser("CUSTOMER", {
      email: new Email("johndoe@example.com"),
    });

    await inMemoryUsersRepository.create(createdUser);

    const result = await sut.execute({
      cpf: Cpf.create("52998224725"),
      name: "CustomerWithTheSameEmail",
      email: new Email("johndoe@example.com"),
      password: "johndoe@123",
      phone: Phone.create("11987654321"),
      address: Address.create({
        city: "city-1",
        country: "country-1",
        state: "state-1",
        street: "street-1",
        zipCode: "11111-111",
      }),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceAlreadyExistsError);

    expect(inMemoryUsersRepository.items).toHaveLength(1);
    expect(inMemoryUsersRepository.items[0]).toBe(createdUser);
    expect(inMemoryCustomersRepository.items).toHaveLength(0);
  });

  it("not should be able to register a customer with duplicated cpf", async () => {
    const createdCustomer = makeCustomer({
      cpf: Cpf.create("52998224725"),
    });

    await inMemoryCustomersRepository.create(createdCustomer);

    const result = await sut.execute({
      cpf: Cpf.create("529.982.247-25"),
      name: "CustomerWithTheSameCpf",
      email: new Email("johndoe@example.com"),
      password: "johndoe@123",
      phone: Phone.create("11987654321"),
      address: Address.create({
        city: "city-1",
        country: "country-1",
        state: "state-1",
        street: "street-1",
        zipCode: "11111-111",
      }),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceAlreadyExistsError);

    expect(inMemoryCustomersRepository.items[0]).toBe(createdCustomer);
    expect(inMemoryCustomersRepository.items).toHaveLength(1);
    expect(inMemoryUsersRepository.items).toHaveLength(0);
  });
});
