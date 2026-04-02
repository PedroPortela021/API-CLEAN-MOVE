import { Cpf } from "../../../../identity-access/domain/accounts/value-objects/cpf";
import { Customer } from "../../../domain/customer/entities/customer";
import { Either, left, right } from "../../../../../shared/either";
import { ResourceNotFoundError } from "../../../../../shared/errors/resource-not-found-error";
import { CustomersRepository } from "../../repositories/customers-repository";

type GetCustomerUseCaseRequest = {
  cpf: Cpf;
};

type GetCustomerUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    customer: Customer;
  }
>;

export class GetCustomerUseCase {
  constructor(private customersRepository: CustomersRepository) {}

  async execute({
    cpf,
  }: GetCustomerUseCaseRequest): Promise<GetCustomerUseCaseResponse> {
    const customer = await this.customersRepository.findByCpf(cpf.toString());

    if (!customer) {
      return left(new ResourceNotFoundError({ resource: "customer" }));
    }

    return right({
      customer,
    });
  }
}
