import { ResourceAlreadyExistsError } from "../../../../shared/errors/resource-already-exists-error";
import { UnitOfWork } from "../../repositories/unit-of-work";
import { makeCustomer } from "../../../../../tests/factories/customer-factory";
import { makeUser } from "../../../../../tests/factories/user-factory";
import { FakeHashGenerator } from "../../../../../tests/repositories/fake-hash-generator";
import { InMemoryCustomersRepository } from "../../../../../tests/repositories/in-memory-customers-repository";
import { InMemoryUsersRepository } from "../../../../../tests/repositories/in-memory-users-repository";
import { Cpf } from "../../../accounts/domain/value-objects/cpf";
import { Email } from "../../../accounts/domain/value-objects/email";
import { RegisterCustomerUseCase } from "./register-customer";

class FakeUnitOfWork extends UnitOfWork {
  protected perform<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryCustomersRepository: InMemoryCustomersRepository;
let fakeHashGenerator: FakeHashGenerator;
let fakeUnitOfWork: FakeUnitOfWork;

let sut: RegisterCustomerUseCase;

describe("Register a customer", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryCustomersRepository = new InMemoryCustomersRepository();
    fakeHashGenerator = new FakeHashGenerator();
    fakeUnitOfWork = new FakeUnitOfWork();

    sut = new RegisterCustomerUseCase(
      inMemoryUsersRepository,
      inMemoryCustomersRepository,
      fakeHashGenerator,
      fakeUnitOfWork,
    );
  });

  it("should be able to register a customer with valid data", async () => {
    const result = await sut.execute({
      cpf: "529.982.247-25",
      name: "John Doe",
      email: "johndoe@example.com",
      password: "johndoe@123",
      phone: "11987654321",
      address: {
        city: "city-1",
        country: "country-1",
        state: "state-1",
        street: "street-1",
        zipCode: "11111-111",
      },
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
      cpf: "52998224725",
      name: "CustomerWithTheSameEmail",
      email: "johndoe@example.com",
      password: "johndoe@123",
      phone: "11987654321",
      address: {
        city: "city-1",
        country: "country-1",
        state: "state-1",
        street: "street-1",
        zipCode: "11111-111",
      },
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
      cpf: "529.982.247-25",
      name: "CustomerWithTheSameCpf",
      email: "johndoe@example.com",
      password: "johndoe@123",
      phone: "11987654321",
      address: {
        city: "city-1",
        country: "country-1",
        state: "state-1",
        street: "street-1",
        zipCode: "11111-111",
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceAlreadyExistsError);

    expect(inMemoryCustomersRepository.items[0]).toBe(createdCustomer);
    expect(inMemoryCustomersRepository.items).toHaveLength(1);
    expect(inMemoryUsersRepository.items).toHaveLength(0);
  });
});
