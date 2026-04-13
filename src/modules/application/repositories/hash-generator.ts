import { Injectable } from "@nestjs/common";

@Injectable()
export abstract class HashGenerator {
  abstract hash(value: string): Promise<string>;
}
