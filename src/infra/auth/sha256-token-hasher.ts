import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { TokenHasher } from "../../modules/application/repositories/token-hasher";

@Injectable()
export class Sha256TokenHasher implements TokenHasher {
  async hash(value: string): Promise<string> {
    return createHash("sha256").update(value).digest("hex");
  }
}
