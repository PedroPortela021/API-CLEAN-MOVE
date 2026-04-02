import type { OAuthProvider } from "../../accounts/domain/value-objects/oauth-provider";
import { User } from "../../accounts/domain/entities/user";

export abstract class UsersRepository {
  abstract create(user: User): Promise<void>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(userId: string): Promise<User | null>;
  abstract findByProviderAndSubject(
    provider: OAuthProvider,
    subjectId: string,
  ): Promise<User | null>;
  abstract save(user: User): Promise<void>;
}
