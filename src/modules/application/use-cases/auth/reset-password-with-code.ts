import { Either, left, right } from "../../../../shared/either";
import { InvalidOrExpiredPasswordResetCodeError } from "../../../../shared/errors/invalid-or-expired-password-reset-code-error";
import { User } from "../../../accounts/domain/entities/user";
import { HashGenerator } from "../../repositories/hash-generator";
import { PasswordResetTokensRepository } from "../../repositories/password-reset-tokens-repository";
import { UsersRepository } from "../../repositories/users-repository";

type ResetPasswordWithCodeUseCaseRequest = {
  token: string;
  newPassword: string;
};

type ResetPasswordWithCodeUseCaseResponse = Either<
  InvalidOrExpiredPasswordResetCodeError,
  { user: User }
>;

export class ResetPasswordWithCodeUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private passwordResetTokensRepository: PasswordResetTokensRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    token,
    newPassword,
  }: ResetPasswordWithCodeUseCaseRequest): Promise<ResetPasswordWithCodeUseCaseResponse> {
    const hashedToken = await this.hashGenerator.hash(token);
    const tokenEntity =
      await this.passwordResetTokensRepository.findByHashedCode(hashedToken);

    if (!tokenEntity || tokenEntity.isExpired(new Date())) {
      return left(new InvalidOrExpiredPasswordResetCodeError());
    }

    const user = await this.usersRepository.findById(
      tokenEntity.userId.toString(),
    );

    if (!user) {
      return left(new InvalidOrExpiredPasswordResetCodeError());
    }

    const hashedPassword = await this.hashGenerator.hash(newPassword);
    user.changePassword(hashedPassword);

    await this.usersRepository.save(user);
    await this.passwordResetTokensRepository.deleteByUserId(user.id.toString());

    return right({ user });
  }
}
