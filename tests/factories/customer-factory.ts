import {
  Customer,
  CustomerProps,
} from "../../src/modules/customer/domain/entities/customer";
import { Cpf } from "../../src/modules/accounts/domain/value-objects/cpf";
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
