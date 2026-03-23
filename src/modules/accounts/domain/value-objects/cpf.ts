import { ValueObject } from "../../../../shared/entities/value-object";

type CpfProps = {
  value: string;
};

export class InvalidCpfError extends Error {
  constructor(value: string) {
    super(`Invalid CPF: ${value}`);
    this.name = "InvalidCpfError";
  }
}

export class Cpf extends ValueObject<CpfProps> {
  private constructor(props: CpfProps) {
    super(props);
  }

  public static create(rawValue: string): Cpf {
    const normalized = Cpf.normalize(rawValue);

    if (!Cpf.isValid(normalized)) {
      throw new InvalidCpfError(rawValue);
    }

    return new Cpf({ value: normalized });
  }

  public get value(): string {
    return this.props.value;
  }

  public get formatted(): string {
    return this.props.value.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      "$1.$2.$3-$4",
    );
  }

  public toString(): string {
    return this.props.value;
  }

  private static normalize(value: string): string {
    return value.replace(/\D/g, "");
  }

  private static isValid(cpf: string): boolean {
    if (!cpf || cpf.length !== 11) {
      return false;
    }

    if (/^(\d)\1+$/.test(cpf)) {
      return false;
    }

    const digits = cpf.split("").map(Number);

    const firstCheckDigit = Cpf.calculateCheckDigit(
      digits.slice(0, 9),
      [10, 9, 8, 7, 6, 5, 4, 3, 2],
    );

    const secondCheckDigit = Cpf.calculateCheckDigit(
      digits.slice(0, 10),
      [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
    );

    return firstCheckDigit === digits[9] && secondCheckDigit === digits[10];
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
