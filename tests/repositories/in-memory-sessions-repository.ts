import { Session } from "../../src/modules/accounts/domain/entities/session";
import { SessionsRepository } from "../../src/modules/application/repositories/sessions-repository";

export class InMemorySessionsRepository implements SessionsRepository {
  public items: Session[] = [];

  async create(session: Session): Promise<void> {
    this.items.push(session);
  }

  async findById(id: string): Promise<Session | null> {
    const session = this.items.find((item) => item.id.toString() === id);

    return session ?? null;
  }

  async findManyByUserId(userId: string): Promise<Session[]> {
    return this.items.filter((item) => item.userId.toString() === userId);
  }

  async save(session: Session): Promise<void> {
    const sessionIndex = this.items.findIndex((item) =>
      item.id.equals(session.id),
    );

    if (sessionIndex === -1) {
      this.items.push(session);
      return;
    }

    this.items[sessionIndex] = session;
  }

  async deleteById(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id.toString() !== id);
  }
}
