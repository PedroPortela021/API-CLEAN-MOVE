import {
  Customer,
  CustomerProps,
} from "../../src/modules/customer/domain/entities/customer";
import { Cpf } from "../../src/modules/accounts/domain/value-objects/cpf";
import { PrismaCustomerMapper } from "../../src/infra/database/prisma/mappers/prisma-customer-mapper";
import { PrismaService } from "../../src/infra/database/prisma/prisma.service";
import { UniqueEntityId } from "../../src/shared/entities/unique-entity-id";

export function makeCustomer(
  override?: Partial<CustomerProps>,
  id?: UniqueEntityId,
) {
  const customer = Customer.create(
    {
      userId: new UniqueEntityId(),
      cpf: Cpf.create("52998224725"),
      ...override,
    },
    id,
  );

  return customer;
}

export class CustomerFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaCustomer(
    override?: Partial<CustomerProps>,
    id?: UniqueEntityId,
  ) {
    const customer = makeCustomer(override, id);

    await this.prisma.customer.create({
      data: PrismaCustomerMapper.toPrisma(customer),
    });

    return customer;
  }
}
