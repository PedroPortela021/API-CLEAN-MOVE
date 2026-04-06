import { randomInt } from "node:crypto";

import { ResetCodeGenerator } from "./reset-code-generator";

export class NumericResetCodeGenerator implements ResetCodeGenerator {
  generate(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, "0");
  }
}
