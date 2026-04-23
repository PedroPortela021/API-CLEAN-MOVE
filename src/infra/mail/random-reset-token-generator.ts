import { randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ResetCodeGenerator } from "../../modules/application/repositories/reset-code-generator";

@Injectable()
export class RandomResetTokenGenerator implements ResetCodeGenerator {
  generate(): string {
    return randomBytes(32).toString("hex");
  }
}
