import { User } from "../../modules/accounts/domain/entities/user";
import { UsersRepository } from "../../modules/application/repositories/users-repository";

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = [];

  async create(user: User): Promise<void> {
    this.items.push(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.items.find((item) => item.email.toString() === email);

    if (!user) {
      return null;
    }

    return user;
  }
}
