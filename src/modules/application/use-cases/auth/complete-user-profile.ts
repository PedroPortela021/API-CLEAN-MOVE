import { User } from "../../../accounts/domain/entities/user";
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

    if (user.isProfileComplete()) {
      return left(new NotAllowedError("User profile is already complete."));
    }

    user.completeProfile({ phone, address });

    await this.usersRepository.save(user);

    return right({ user });
  }
}
