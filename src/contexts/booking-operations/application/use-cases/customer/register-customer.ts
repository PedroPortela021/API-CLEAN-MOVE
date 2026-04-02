import { Cpf } from "../../../../identity-access/domain/accounts/value-objects/cpf";
import { Customer } from "../../../domain/customer/entities/customer";
import { Either, left, right } from "../../../../../shared/either";
import { ResourceAlreadyExistsError } from "../../../../../shared/errors/resource-already-exists-error";
import { User } from "../../../../identity-access/domain/accounts/entities/user";
import { UserRole } from "../../../../identity-access/domain/accounts/value-objects/user-role";
import { Email } from "../../../../identity-access/domain/accounts/value-objects/email";
import { Phone } from "../../../../identity-access/domain/accounts/value-objects/phone";
import { Address } from "../../../../identity-access/domain/accounts/value-objects/address";
import { UsersRepository } from "../../../../identity-access/application/repositories/users-repository";
import { HashGenerator } from "../../../../identity-access/application/repositories/hash-generator";
import { CustomersRepository } from "../../repositories/customers-repository";

type RegisterCustomerUseCaseRequest = {
  cpf: Cpf;
  name: string;
  email: Email;
  password: string;
  phone: Phone;
  address: Address;
};

type RegisterCustomerUseCaseResponse = Either<
  ResourceAlreadyExistsError,
  {
    customer: Customer;
  }
>;

export class RegisterCustomerUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private customersRepository: CustomersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    cpf,
    email,
    name,
    password,
    phone,
    address,
  }: RegisterCustomerUseCaseRequest): Promise<RegisterCustomerUseCaseResponse> {
    const [customerWithTheSameCpf, userWithTheSameEmail] = await Promise.all([
      this.customersRepository.findByCpf(cpf.toString()),
      this.usersRepository.findByEmail(email.toString()),
    ]);

    if (customerWithTheSameCpf || userWithTheSameEmail) {
      return left(
        new ResourceAlreadyExistsError("Customer already registered."),
      );
    }

    const userRole: UserRole = "CUSTOMER";
    const hashedPassword = await this.hashGenerator.hash(password);

    const userInputValues = {
      role: userRole,
      cpf,
      name,
      email,
      hashedPassword,
      phone,
      address,
    };

    const user = User.create(userInputValues);

    const customer = Customer.create({
      userId: user.id,
      cpf,
    });

    await Promise.all([
      this.usersRepository.create(user),
      this.customersRepository.create(customer),
    ]);

    return right({
      customer,
    });
  }
}
