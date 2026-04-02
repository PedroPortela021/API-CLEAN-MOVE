import { User } from "../../domain/accounts/entities/user";

export abstract class UsersRepository {
  abstract create(user: User): Promise<void>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(userId: string): Promise<User | null>;
  abstract save(user: User): Promise<void>;
}
