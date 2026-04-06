import { PasswordResetToken } from "../../../accounts/domain/entities/password-reset-token";
import { Email } from "../../../accounts/domain/value-objects/email";
import { Either, left, right } from "../../../../shared/either";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { HashGenerator } from "../../repositories/hash-generator";
import { MailSender } from "../../gateways/mail-sender";
import { PasswordResetTokensRepository } from "../../repositories/password-reset-tokens-repository";
import { ResetCodeGenerator } from "../../repositories/reset-code-generator";
import { UsersRepository } from "../../repositories/users-repository";

const DEFAULT_CODE_TTL_MS = 15 * 60 * 1000;

type RequestPasswordResetUseCaseRequest = {
  email: Email;
};

type RequestPasswordResetUseCaseResponse = Either<
  ResourceNotFoundError,
  undefined
>;

export class RequestPasswordResetUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private passwordResetTokensRepository: PasswordResetTokensRepository,
    private hashGenerator: HashGenerator,
    private mailSender: MailSender,
    private resetCodeGenerator: ResetCodeGenerator,
    private codeTtlMs: number = DEFAULT_CODE_TTL_MS,
  ) {}

  async execute({
    email,
  }: RequestPasswordResetUseCaseRequest): Promise<RequestPasswordResetUseCaseResponse> {
    const user = await this.usersRepository.findByEmail(email.toString());

    if (!user) {
      return left(new ResourceNotFoundError({ resource: "user" }));
    }

    const plainCode = this.resetCodeGenerator.generate();
    const hashedCode = await this.hashGenerator.hash(plainCode);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.codeTtlMs);

    const token = PasswordResetToken.create({
      userId: user.id,
      hashedCode,
      expiresAt,
    });

    await this.passwordResetTokensRepository.upsert(token);

    await this.mailSender.sendPasswordResetCode({
      to: user.email.getValue(),
      code: plainCode,
    });

    return right(undefined);
  }
}
