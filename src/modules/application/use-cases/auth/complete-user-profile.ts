import { User } from "../../../accounts/domain/entities/user";
import { ProfileAlreadyCompleteError } from "../../../accounts/domain/errors/profile-already-complete-error";
import { Address } from "../../../accounts/domain/value-objects/address";
import { Phone } from "../../../accounts/domain/value-objects/phone";
import { Either, left, right } from "../../../../shared/either";
import { NotAllowedError } from "../../../../shared/errors/not-allowed-error";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { UsersRepository } from "../../repositories/users-repository";

type CompleteUserProfileUseCaseRequest = {
  userId: string;
  phone: Phone;
  address: Address;
};

type CompleteUserProfileUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { user: User }
>;

export class CompleteUserProfileUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
    phone,
    address,
  }: CompleteUserProfileUseCaseRequest): Promise<CompleteUserProfileUseCaseResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      return left(new ResourceNotFoundError({ resource: "user" }));
    }

    try {
      user.completeProfile({ phone, address });
    } catch (error) {
      if (error instanceof ProfileAlreadyCompleteError) {
        return left(new NotAllowedError(error.message));
      }

      throw error;
    }

    await this.usersRepository.save(user);

    return right({ user });
  }
}
