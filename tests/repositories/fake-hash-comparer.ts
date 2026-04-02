import { HashComparer } from "../../src/modules/application/repositories/hash-comparer";

export class FakeHashComparer implements HashComparer {
  async compare(plain: string, hash: string): Promise<boolean> {
    const expectedHash = `${plain}-hashed`;
    return expectedHash === hash;
  }
}
