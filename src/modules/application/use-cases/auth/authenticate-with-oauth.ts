import { User } from "../../../accounts/domain/entities/user";
import { Injectable } from "@nestjs/common";
import { Email } from "../../../accounts/domain/value-objects/email";
import type { OAuthProvider } from "../../../accounts/domain/value-objects/oauth-provider";
import { UserRole } from "../../../accounts/domain/value-objects/user-role";
import { Either, left, right } from "../../../../shared/either";
import { OAuthEmailNotVerifiedError } from "../../../../shared/errors/oauth-email-not-verified-error";
import { UsersRepository } from "../../repositories/users-repository";

type AuthenticateWithOAuthUseCaseRequest = {
  provider: OAuthProvider;
  subjectId: string;
  email: Email;
  emailVerified: boolean;
  name?: string;
  roleForNewUser?: UserRole;
};

type AuthenticateWithOAuthUseCaseResponse = Either<
  OAuthEmailNotVerifiedError,
  { user: User }
>;

@Injectable()
export class AuthenticateWithOAuthUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    provider,
    subjectId,
    email,
    emailVerified,
    name,
    roleForNewUser,
  }: AuthenticateWithOAuthUseCaseRequest): Promise<AuthenticateWithOAuthUseCaseResponse> {
    if (!emailVerified) {
      return left(new OAuthEmailNotVerifiedError());
    }

    const userByLink = await this.usersRepository.findByProviderAndSubject(
      provider,
      subjectId,
    );

    if (userByLink) {
      return right({ user: userByLink });
    }

    const userByEmail = await this.usersRepository.findByEmail(
      email.toString(),
    );

    if (userByEmail) {
      userByEmail.linkSocialAccount(provider, subjectId);
      await this.usersRepository.save(userByEmail);
      return right({ user: userByEmail });
    }

    const displayName =
      name?.trim() || email.toString().split("@")[0] || "User";

    const user = User.create({
      name: displayName,
      email,
      hashedPassword: null,
      role: roleForNewUser ?? "CUSTOMER",
      phone: null,
      address: null,
      socialAccounts: [{ provider, subjectId }],
    });

    await this.usersRepository.create(user);

    return right({ user });
  }
}
