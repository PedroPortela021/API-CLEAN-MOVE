import { AggregateRoot } from "../../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../../shared/entities/unique-entity-id";
import { Cpf } from "../../../../identity-access/domain/accounts/value-objects/cpf";

export type CustomerProps = {
  userId: UniqueEntityId;
  cpf: Cpf;
};

export class Customer extends AggregateRoot<CustomerProps> {
  get userId() {
    return this.props.userId;
  }

  get cpf() {
    return this.props.cpf;
  }

  static create(props: CustomerProps, id?: UniqueEntityId) {
    const customer = new Customer(props, id);
    return customer;
  }
}
