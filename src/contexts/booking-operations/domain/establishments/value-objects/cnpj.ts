import { ValueObject } from "../../../../../shared/entities/value-object";

type CnpjProps = {
  value: string;
};

export class InvalidCnpjError extends Error {
  constructor(value: string) {
    super(`Invalid CNPJ: ${value}`);
    this.name = "InvalidCnpjError";
  }
}

export class Cnpj extends ValueObject<CnpjProps> {
  private constructor(props: CnpjProps) {
    super(props);
  }

  public static create(rawValue: string): Cnpj {
    const normalized = Cnpj.normalize(rawValue);

    if (!Cnpj.isValid(normalized)) {
      throw new InvalidCnpjError(rawValue);
    }

    return new Cnpj({ value: normalized });
  }

  public get value(): string {
    return this.props.value;
  }

  public get formatted(): string {
    return this.props.value.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    );
  }

  public toString(): string {
    return this.props.value;
  }

  private static normalize(value: string): string {
    return value.replace(/\D/g, "");
  }

  private static isValid(cnpj: string): boolean {
    if (!cnpj || cnpj.length !== 14) {
      return false;
    }

    if (/^(\d)\1+$/.test(cnpj)) {
      return false;
    }

    const digits = cnpj.split("").map(Number);

    const firstCheckDigit = Cnpj.calculateCheckDigit(
      digits.slice(0, 12),
      [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );

    const secondCheckDigit = Cnpj.calculateCheckDigit(
      digits.slice(0, 13),
      [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );

    return firstCheckDigit === digits[12] && secondCheckDigit === digits[13];
  }

  private static calculateCheckDigit(
    numbers: number[],
    weights: number[],
  ): number {
    const total = numbers.reduce((sum, number, index) => {
      const weight = weights[index];

      if (weight === undefined) {
        throw new Error(`Missing weight for index ${index}`);
      }

      return sum + number * weight;
    }, 0);

    const remainder = total % 11;

    return remainder < 2 ? 0 : 11 - remainder;
  }
}
