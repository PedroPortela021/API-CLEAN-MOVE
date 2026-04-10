import { Module } from "@nestjs/common";
import { HashGenerator } from "../../modules/application/repositories/hash-generator";
import { BcryptHasher } from "./bcrypt-hasher";
import { HashComparer } from "../../modules/application/repositories/hash-comparer";

@Module({
  providers: [
    BcryptHasher,
    { provide: HashGenerator, useExisting: BcryptHasher },
    { provide: HashComparer, useExisting: BcryptHasher },
  ],
  exports: [HashGenerator, HashComparer],
})
export class AuthModule {}
