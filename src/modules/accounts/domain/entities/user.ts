import { AggregateRoot } from "../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Address } from "../value-objects/address";
import { Email } from "../value-objects/email";
import { UserRole } from "../value-objects/user-role";

export type UserProps = {
  name: string;
  email: Email;
  hashedPassword: string;
  role: UserRole;
  phone: string;
  address: Address;
};

export class User extends AggregateRoot<UserProps> {
  get name() {
    return this.props.name;
  }
  get email() {
    return this.props.email;
  }
  get hashedPassword() {
    return this.props.hashedPassword;
  }
  get role() {
    return this.props.role;
  }
  get phone() {
    return this.props.phone;
  }
  get address() {
    return this.props.address;
  }

  static create(props: UserProps, id?: UniqueEntityId) {
    const user = new User(props, id);

    return user;
  }
}
