import { ValueObject } from "../../../../shared/entities/value-object";

type PhoneProps = {
  value: string;
};

export class InvalidPhoneError extends Error {
  constructor(value: string) {
    super(`Invalid phone number: ${value}`);
    this.name = "InvalidPhoneError";
  }
}

export class Phone extends ValueObject<PhoneProps> {
  private constructor(props: PhoneProps) {
    super(props);
  }

  public static create(rawValue: string): Phone {
    const normalized = Phone.normalize(rawValue);

    if (!Phone.isValid(normalized)) {
      throw new InvalidPhoneError(rawValue);
    }

    return new Phone({ value: normalized });
  }

  public get value(): string {
    return this.props.value;
  }

  public get formatted(): string {
    if (this.props.value.length === 11) {
      return this.props.value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }

    return this.props.value.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }

  public toString(): string {
    return this.props.value;
  }

  private static normalize(value: string): string {
    return value.replace(/\D/g, "");
  }

  private static isValid(phone: string): boolean {
    if (!phone || (phone.length !== 10 && phone.length !== 11)) {
      return false;
    }

    if (/^(\d)\1+$/.test(phone)) {
      return false;
    }

    const ddd = phone.slice(0, 2);
    const subscriber = phone.slice(2);

    if (ddd[0] === "0" || ddd[1] === "0") {
      return false;
    }

    if (phone.length === 11) {
      return /^9\d{8}$/.test(subscriber);
    }

    return /^[2-9]\d{7}$/.test(subscriber);
  }
}
