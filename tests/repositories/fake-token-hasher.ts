import { TokenHasher } from "../../src/modules/application/repositories/token-hasher";

export class FakeTokenHasher implements TokenHasher {
  async hash(value: string): Promise<string> {
    return `${value}-token-hashed`;
  }
}
