import {
  Customer as PrismaCustomer,
  Prisma,
} from "../../../../generated/prisma/browser";
import { Cpf } from "../../../../modules/accounts/domain/value-objects/cpf";
import { Customer } from "../../../../modules/customer/domain/entities/customer";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";

export class PrismaCustomerMapper {
  static toDomain(raw: PrismaCustomer): Customer {
    return Customer.create(
      {
        userId: new UniqueEntityId(raw.userId),
        cpf: Cpf.create(raw.cpf),
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(raw: Customer): Prisma.CustomerUncheckedCreateInput {
    return {
      id: raw.id.toString(),
      userId: raw.userId.toString(),
      cpf: raw.cpf.toString(),
    };
  }
}
