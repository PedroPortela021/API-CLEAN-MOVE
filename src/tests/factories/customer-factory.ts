import {
  Customer,
  CustomerProps,
} from "../../contexts/booking-operations/domain/customer/entities/customer";
import { Cpf } from "../../contexts/identity-access/domain/accounts/value-objects/cpf";
import { UniqueEntityId } from "../../shared/entities/unique-entity-id";

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
