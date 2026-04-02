import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { makeCustomer } from "../../../../../tests/factories/customer-factory";
import { InMemoryCustomersRepository } from "../../../../../tests/repositories/in-memory-customers-repository";
import { Cpf } from "../../../accounts/domain/value-objects/cpf";
import { GetCustomerUseCase } from "./get-customer";

let inMemoryCustomersRepository: InMemoryCustomersRepository;

let sut: GetCustomerUseCase;

describe("Get a customer", () => {
  beforeEach(() => {
    inMemoryCustomersRepository = new InMemoryCustomersRepository();

    sut = new GetCustomerUseCase(inMemoryCustomersRepository);
  });

  it("should be able to get a customer by cpf", async () => {
    const createdCustomer = makeCustomer({
      cpf: Cpf.create("52998224725"),
    });

    await inMemoryCustomersRepository.create(createdCustomer);

    const result = await sut.execute({
      cpf: Cpf.create("529.982.247-25"),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.customer).toBe(createdCustomer);
  });

  it("not should be able to get a customer with unknown cpf", async () => {
    const result = await sut.execute({
      cpf: Cpf.create("11144477735"),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
