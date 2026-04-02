import { User } from "../../../domain/accounts/entities/user";
import {
  AddressProps,
  InvalidAddressError,
} from "../../../domain/accounts/value-objects/address";
import { Either, left, right } from "../../../../../shared/either";
import { ResourceAlreadyExistsError } from "../../../../../shared/errors/resource-already-exists-error";
import { ResourceNotFoundError } from "../../../../../shared/errors/resource-not-found-error";
import { UsersRepository } from "../../repositories/users-repository";
import { InvalidEmailError } from "../../../domain/accounts/value-objects/email";
import { InvalidPhoneError } from "../../../domain/accounts/value-objects/phone";
import { UnexpectedDomainError } from "../../../../../shared/errors/unexpected-domain-error";

type UpdateUserUseCaseRequest = {
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: AddressProps;
};

export class InvalidUserUpdateInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUserUpdateInputError";
  }
}

type UpdateUserUseCaseResponse = Either<
  | ResourceNotFoundError
  | ResourceAlreadyExistsError
  | InvalidUserUpdateInputError,
  {
    user: User;
  }
>;

export class UpdateUserUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
    name,
    email,
    phone,
    address,
  }: UpdateUserUseCaseRequest): Promise<UpdateUserUseCaseResponse> {
    const existingUser = await this.usersRepository.findById(userId);

    if (!existingUser) {
      return left(new ResourceNotFoundError({ resource: "user" }));
    }

    if (email !== undefined) {
      const userWithTheSameEmail = await this.usersRepository.findByEmail(
        email.toString(),
      );

      if (
        userWithTheSameEmail &&
        !userWithTheSameEmail.id.equals(existingUser.id)
      ) {
        return left(new ResourceAlreadyExistsError("Email already in use."));
      }
    }

    try {
      existingUser.update({
        name,
        email,
        phone,
        address,
      });
    } catch (error) {
      if (
        error instanceof InvalidEmailError ||
        error instanceof InvalidPhoneError ||
        error instanceof InvalidAddressError
      ) {
        return left(new InvalidUserUpdateInputError(error.message));
      }
      return left(new UnexpectedDomainError());
    }

    await this.usersRepository.save(existingUser);

    return right({
      user: existingUser,
    });
  }
}
