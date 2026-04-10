import { Injectable } from "@nestjs/common";
import { compare, hash } from "bcrypt";
import { HashComparer } from "../../modules/application/repositories/hash-comparer";
import { HashGenerator } from "../../modules/application/repositories/hash-generator";
import { EnvService } from "../env/env.service";

@Injectable()
export class BcryptHasher implements HashGenerator, HashComparer {
  private readonly hashSaltLength: number;

  constructor(envService: EnvService) {
    this.hashSaltLength = envService.get("NODE_ENV") === "production" ? 8 : 1;
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }

  async hash(plain: string): Promise<string> {
    return hash(plain, this.hashSaltLength);
  }
}
