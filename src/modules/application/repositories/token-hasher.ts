import { Injectable } from "@nestjs/common";

@Injectable()
export abstract class TokenHasher {
  abstract hash(value: string): Promise<string>;
}
