import { AggregateRoot } from "../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Address } from "../value-objects/address";
import { Email } from "../value-objects/email";
import { Phone } from "../value-objects/phone";
import { UserRole } from "../value-objects/user-role";

export type UserProps = {
  name: string;
  email: Email;
  hashedPassword: string;
  role: UserRole;
  phone: Phone;
  address: Address;
  createdAt?: Date;
  updatedAt?: Date;
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

  get createdAt(): Date {
    return this.props.createdAt ?? new Date(0);
  }

  get updatedAt(): Date {
    return this.props.updatedAt ?? new Date(0);
  }

  touch() {
    this.props.updatedAt = new Date();
  }

  changeName(name: string) {
    if (this.props.name === name) return;

    this.props.name = name;
    this.touch();
  }

  changeEmail(email: Email) {
    if (this.props.email.equals(email)) return;

    this.props.email = email;
    this.touch();
  }

  changePhone(phone: Phone) {
    if (this.props.phone.equals(phone)) return;

    this.props.phone = phone;
    this.touch();
  }

  changeAddress(address: Address) {
    if (this.props.address.equals(address)) return;

    this.props.address = address;
    this.touch();
  }

  static create(props: UserProps, id?: UniqueEntityId) {
    const createdAt = props.createdAt ?? new Date();
    const updatedAt = props.updatedAt ?? createdAt;

    const user = new User(
      {
        ...props,
        createdAt,
        updatedAt,
      },
      id,
    );

    return user;
  }
}
