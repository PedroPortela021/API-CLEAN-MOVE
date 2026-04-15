import { Injectable } from "@nestjs/common";

import {
  Address,
  AddressProps,
  InvalidAddressError,
} from "../../../accounts/domain/value-objects/address";
import {
  Cpf,
  InvalidCpfError,
} from "../../../accounts/domain/value-objects/cpf";
import {
  Email,
  InvalidEmailError,
} from "../../../accounts/domain/value-objects/email";
import {
  InvalidPhoneError,
  Phone,
} from "../../../accounts/domain/value-objects/phone";
import { Customer } from "../../../customer/domain/entities/customer";
import { InvalidRegisterCustomerInputError } from "../../../customer/domain/errors/invalid-register-customer-input-error";
import { User } from "../../../accounts/domain/entities/user";
import { UserRole } from "../../../accounts/domain/value-objects/user-role";
import { Either, left, right } from "../../../../shared/either";
import { PersistenceError } from "../../../../shared/errors/persistence-error";
import { ResourceAlreadyExistsError } from "../../../../shared/errors/resource-already-exists-error";
import { UnexpectedDomainError } from "../../../../shared/errors/unexpected-domain-error";
import { UniqueConstraintViolationError } from "../../../../shared/errors/unique-constraint-violation-error";
import { CustomersRepository } from "../../repositories/customers-repository";
import { HashGenerator } from "../../repositories/hash-generator";
import { UnitOfWork } from "../../repositories/unit-of-work";
import { UsersRepository } from "../../repositories/users-repository";

type RegisterCustomerUseCaseRequest = {
  cpf: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: AddressProps;
};

type RegisterCustomerUseCaseResponse = Either<
  | ResourceAlreadyExistsError
  | InvalidRegisterCustomerInputError
  | UnexpectedDomainError,
  {
    customer: Customer;
  }
>;

@Injectable()
export class RegisterCustomerUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private customersRepository: CustomersRepository,
    private hashGenerator: HashGenerator,
    private unitOfWork: UnitOfWork,
  ) {}

  async execute({
    cpf: rawCpf,
    email: rawEmail,
    name,
    password,
    phone: rawPhone,
    address: rawAddress,
  }: RegisterCustomerUseCaseRequest): Promise<RegisterCustomerUseCaseResponse> {
    let cpf: Cpf;
    let email: Email;
    let phone: Phone;
    let address: Address;

    try {
      cpf = Cpf.create(rawCpf);
      email = new Email(rawEmail);
      phone = Phone.create(rawPhone);
      address = Address.create(rawAddress);
    } catch (error) {
      if (
        error instanceof InvalidCpfError ||
        error instanceof InvalidEmailError ||
        error instanceof InvalidPhoneError ||
        error instanceof InvalidAddressError
      ) {
        return left(new InvalidRegisterCustomerInputError(error.message));
      }

      return left(new UnexpectedDomainError());
    }

    let customerWithTheSameCpf: Customer | null;
    let userWithTheSameEmail: User | null;

    try {
      [customerWithTheSameCpf, userWithTheSameEmail] = await Promise.all([
        this.customersRepository.findByCpf(cpf.toString()),
        this.usersRepository.findByEmail(email.toString()),
      ]);
    } catch (error) {
      if (error instanceof UniqueConstraintViolationError) {
        return left(
          new ResourceAlreadyExistsError("Customer already registered."),
        );
      }

      if (error instanceof PersistenceError) {
        return left(new UnexpectedDomainError());
      }

      return left(new UnexpectedDomainError());
    }

    if (customerWithTheSameCpf || userWithTheSameEmail) {
      return left(
        new ResourceAlreadyExistsError("Customer already registered."),
      );
    }

    const userRole: UserRole = "CUSTOMER";
    const hashedPassword = await this.hashGenerator.hash(password);

    const user = User.create({
      role: userRole,
      name,
      email,
      hashedPassword,
      phone,
      address,
    });

    const customer = Customer.create({
      userId: user.id,
      cpf,
    });

    try {
      await this.unitOfWork.execute(async () => {
        await this.usersRepository.create(user);
        await this.customersRepository.create(customer);
      });
    } catch (error) {
      if (error instanceof UniqueConstraintViolationError) {
        return left(
          new ResourceAlreadyExistsError("Customer already registered."),
        );
      }

      if (error instanceof PersistenceError) {
        return left(new UnexpectedDomainError());
      }

      return left(new UnexpectedDomainError());
    }

    return right({
      customer,
    });
  }
}
