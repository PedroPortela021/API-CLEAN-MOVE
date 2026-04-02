import { User } from "../../../accounts/domain/entities/user";
import { Email } from "../../../accounts/domain/value-objects/email";
import { Either, left, right } from "../../../../shared/either";
import { InvalidCredentialsError } from "../../../../shared/errors/invalid-credentials-error";
import { HashComparer } from "../../repositories/hash-comparer";
import { UsersRepository } from "../../repositories/users-repository";

type LoginWithCredentialsUseCaseRequest = {
  email: Email;
  password: string;
};

type LoginWithCredentialsUseCaseResponse = Either<
  InvalidCredentialsError,
  { user: User }
>;

export class LoginWithCredentialsUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashComparer: HashComparer,
  ) {}

  async execute({
    email,
    password,
  }: LoginWithCredentialsUseCaseRequest): Promise<LoginWithCredentialsUseCaseResponse> {
    const user = await this.usersRepository.findByEmail(email.toString());

    if (!user || user.hashedPassword === null) {
      return left(new InvalidCredentialsError());
    }

    const passwordMatches = await this.hashComparer.compare(
      password,
      user.hashedPassword,
    );

    if (!passwordMatches) {
      return left(new InvalidCredentialsError());
    }

    return right({ user });
  }
}
