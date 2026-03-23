import { AggregateRoot } from "../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Cpf } from "../../../accounts/domain/value-objects/cpf";
import { Email } from "../../../accounts/domain/value-objects/email";
import { Phone } from "../../../accounts/domain/value-objects/phone";

export type CustomerProps = {
  ownerId: UniqueEntityId;
  name: string;
  email: Email;
  phone: Phone;
  cpf: Cpf;
  hashedPassword: string;
};

export class Customer extends AggregateRoot<CustomerProps> {
  get ownerId() {
    return this.props.ownerId;
  }

  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }

  get phone() {
    return this.props.phone;
  }

  get cpf() {
    return this.props.cpf;
  }

  get hashedPassword() {
    return this.props.hashedPassword;
  }

  static create(props: CustomerProps, id?: UniqueEntityId) {
    const customer = new Customer(props, id);
    return customer;
  }
}
