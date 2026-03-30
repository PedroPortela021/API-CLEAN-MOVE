import { ValueObject } from "../../../../shared/entities/value-object";

export type AddressProps = {
  street: string;
  country: string;
  state: string;
  zipCode: string;
  city: string;
};

export class InvalidAddressError extends Error {
  constructor(message?: string, field?: keyof AddressProps) {
    super(message ? message : field ? `Invalid ${field}` : "Invalid address");
    this.name = "InvalidAddressError";
  }
}

export class Address extends ValueObject<AddressProps> {
  private constructor(props: AddressProps) {
    super(props);
  }

  private static isValidZipCode(value: string): boolean {
    return /^\d{5}-?\d{3}$/.test(value);
  }

  public static create(props: AddressProps): Address {
    const street = props.street.trim();
    const country = props.country.trim();
    const state = props.state.trim();
    const zipCode = props.zipCode.trim();
    const city = props.city.trim();

    if (!this.isValidZipCode(zipCode)) {
      throw new InvalidAddressError("Invalid zip code");
    }

    if (!street) {
      throw new InvalidAddressError("Street is required");
    }

    if (!country) {
      throw new InvalidAddressError("Country is required");
    }

    if (!state) {
      throw new InvalidAddressError("State is required");
    }

    if (!city) {
      throw new InvalidAddressError("City is required");
    }

    return new Address({
      street,
      country,
      state,
      zipCode,
      city,
    });
  }

  public get street(): string {
    return this.props.street;
  }

  public get country(): string {
    return this.props.country;
  }

  public get state(): string {
    return this.props.state;
  }

  public get zipCode(): string {
    return this.props.zipCode;
  }

  public get city(): string {
    return this.props.city;
  }

  public toString(): string {
    return `${this.props.street}, ${this.props.city}, ${this.props.state}, ${this.props.zipCode}, ${this.props.country}`;
  }
}
