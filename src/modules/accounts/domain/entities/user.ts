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
  createdAt: Date;
  updatedAt: Date;
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
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  touch() {
    this.props.updatedAt = new Date();
  }

  changeName(name: string) {
    if (!name) {
      // TODO: Implement validation
    }
    if (this.props.name === name) return;

    this.props.name = name;
    this.touch();
  }

  changeEmail(email: string) {
    if (!email) {
      // TODO: Implement validation
    }
    if (this.props.email.getValue() === email) return;

    this.props.email = new Email(email);
    this.touch();
  }

  changePhone(phone: string) {
    if (!phone) {
      // TODO: Implement validation
    }
    if (this.props.phone.value === phone) return;

    this.props.phone = Phone.create(phone);
    this.touch();
  }

  changeAddress(address: Address) {
    if (!address) {
      // TODO: Implement validation
    }
    if (this.props.address.equals(address)) return;

    this.props.address = address;
    this.touch();
  }

  update(data: {
    name?: string;
    email?: Email;
    phone?: Phone;
    address?: Address;
  }) {
    if (data.name !== undefined) {
      this.changeName(data.name);
    }

    if (data.email !== undefined) {
      this.changeEmail(data.email.toString());
    }

    if (data.phone !== undefined) {
      this.changePhone(data.phone.toString());
    }

    if (data.address !== undefined) {
      this.changeAddress(data.address);
    }
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
