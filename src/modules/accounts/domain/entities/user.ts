import { AggregateRoot } from "../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Optional } from "../../../../shared/types/optional";
import { Address, AddressProps } from "../value-objects/address";
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
  createdAt: Date | null;
  updatedAt: Date | null;
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

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  touch() {
    this.props.updatedAt = new Date();
  }

  changeName(name: string) {
    const normalizedName = name.trim();

    if (this.props.name === normalizedName) return;

    this.props.name = normalizedName;
    this.touch();
  }

  changeEmail(email: Email) {
    if (this.props.email === email) return;

    this.props.email = email;
    this.touch();
  }

  changePhone(phone: Phone) {
    if (this.props.phone === phone) return;

    this.props.phone = phone;
    this.touch();
  }

  changeAddress(address: Address) {
    if (this.props.address.equals(address)) return;

    this.props.address = address;
    this.touch();
  }

  update(data: {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    address?: AddressProps | undefined;
  }) {
    const newEmail = data.email ? new Email(data.email) : undefined;

    const newPhone = data.phone ? Phone.create(data.phone) : undefined;

    const newAddress = data.address ? Address.create(data.address) : undefined;

    if (data.name !== undefined) {
      this.changeName(data.name);
    }

    if (newEmail) {
      this.changeEmail(newEmail);
    }

    if (newPhone) {
      this.changePhone(newPhone);
    }

    if (newAddress) {
      this.changeAddress(newAddress);
    }
  }

  static create(
    props: Optional<UserProps, "createdAt" | "updatedAt">,
    id?: UniqueEntityId,
  ) {
    const user = new User(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );

    return user;
  }
}
