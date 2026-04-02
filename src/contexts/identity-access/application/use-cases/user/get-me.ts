import { User } from "../../../domain/accounts/entities/user";
import { Either, left, right } from "../../../../../shared/either";
import { ResourceNotFoundError } from "../../../../../shared/errors/resource-not-found-error";
import { UsersRepository } from "../../repositories/users-repository";

type GetMeUseCaseRequest = {
  userId: string;
};

type GetMeUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    user: User;
  }
>;

export class GetMeUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
  }: GetMeUseCaseRequest): Promise<GetMeUseCaseResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      return left(new ResourceNotFoundError({ resource: "user" }));
    }

    return right({
      user,
    });
  }
}
