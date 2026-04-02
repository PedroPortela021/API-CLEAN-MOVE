import { Email } from "../../../accounts/domain/value-objects/email";
import { Either, left, right } from "../../../../shared/either";
import { InvalidOrExpiredPasswordResetCodeError } from "../../../../shared/errors/invalid-or-expired-password-reset-code-error";
import { User } from "../../../accounts/domain/entities/user";
import { HashComparer } from "../../repositories/hash-comparer";
import { HashGenerator } from "../../repositories/hash-generator";
import { PasswordResetTokensRepository } from "../../repositories/password-reset-tokens-repository";
import { UsersRepository } from "../../repositories/users-repository";

type ResetPasswordWithCodeUseCaseRequest = {
  email: Email;
  code: string;
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
    private hashComparer: HashComparer,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    email,
    code,
    newPassword,
  }: ResetPasswordWithCodeUseCaseRequest): Promise<ResetPasswordWithCodeUseCaseResponse> {
    const user = await this.usersRepository.findByEmail(email.toString());

    if (!user) {
      return left(new InvalidOrExpiredPasswordResetCodeError());
    }

    const token = await this.passwordResetTokensRepository.findByUserId(
      user.id.toString(),
    );

    if (!token || token.isExpired(new Date())) {
      return left(new InvalidOrExpiredPasswordResetCodeError());
    }

    const codeMatches = await this.hashComparer.compare(code, token.hashedCode);

    if (!codeMatches) {
      return left(new InvalidOrExpiredPasswordResetCodeError());
    }

    const hashedPassword = await this.hashGenerator.hash(newPassword);
    user.changePassword(hashedPassword);

    await this.usersRepository.save(user);
    await this.passwordResetTokensRepository.deleteByUserId(user.id.toString());

    return right({ user });
  }
}
