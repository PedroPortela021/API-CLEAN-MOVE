import { ResetCodeGenerator } from "../../src/modules/application/repositories/reset-code-generator";

export class FakeResetCodeGenerator implements ResetCodeGenerator {
  constructor(private readonly code = "123456") {}

  generate(): string {
    return this.code;
  }
}
