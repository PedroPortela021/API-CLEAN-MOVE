import { Injectable } from "@nestjs/common";

import { Env, envSchema } from "./env";

@Injectable()
export class EnvService {
  private readonly env: Env;

  constructor() {
    this.env = envSchema.parse(process.env);
  }

  get<T extends keyof Env>(key: T): Env[T] {
    return this.env[key];
  }
}
