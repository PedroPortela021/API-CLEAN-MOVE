import { User } from "../../../accounts/domain/entities/user";
import { Address } from "../../../accounts/domain/value-objects/address";
import { Email } from "../../../accounts/domain/value-objects/email";
import { Phone } from "../../../accounts/domain/value-objects/phone";
import { Either, left, right } from "../../../../shared/either";
import { ResourceAlreadyExistsError } from "../../../../shared/errors/resource-already-exists-error";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { UsersRepository } from "../../repositories/users-repository";

type UpdateUserUseCaseRequest = {
  user: User;
  name?: string;
  email?: Email;
  phone?: Phone;
  address?: Address;
};

type UpdateUserUseCaseResponse = Either<
  ResourceNotFoundError | ResourceAlreadyExistsError,
  {
    user: User;
  }
>;

export class UpdateUserUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    user,
    name,
    email,
    phone,
    address,
  }: UpdateUserUseCaseRequest): Promise<UpdateUserUseCaseResponse> {
    const existingUser = await this.usersRepository.findById(
      user.id.toString(),
    );

    if (!existingUser) {
      return left(new ResourceNotFoundError("User not found."));
    }

    if (email) {
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

    if (name) {
      existingUser.changeName(name);
    }

    if (email) {
      existingUser.changeEmail(email);
    }

    if (phone) {
      existingUser.changePhone(phone);
    }

    if (address) {
      existingUser.changeAddress(address);
    }

    await this.usersRepository.save(existingUser);

    return right({
      user: existingUser,
    });
  }
}
