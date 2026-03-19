import { HashGenerator } from "../../modules/application/repositories/hash-generator";

export class FakeHashGenerator implements HashGenerator {
  async hash(value: string): Promise<string> {
    const hashedValue = `${value}-hashed`;

    return hashedValue;
  }
}
