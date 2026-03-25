import { ValueObject } from "../../../../shared/entities/value-object";

type MoneyProps = {
  amountInCents: number;
};

export class InvalidMoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMoneyError";
  }
}

export class Money extends ValueObject<MoneyProps> {
  get amountInCents() {
    return this.props.amountInCents;
  }

  get value() {
    return this.props.amountInCents / 100;
  }

  static create(amountInCents: number) {
    if (!Number.isInteger(amountInCents)) {
      throw new InvalidMoneyError("Amount must be an integer.");
    }

    if (amountInCents < 0) {
      throw new InvalidMoneyError("Amount cannot be negative.");
    }

    return new Money({ amountInCents });
  }

  add(other: Money): Money {
    return Money.create(this.amountInCents + other.amountInCents);
  }

  subtract(other: Money): Money {
    const result = this.amountInCents - other.amountInCents;

    if (result < 0) {
      throw new Error("Result cannot be negative.");
    }

    return Money.create(result);
  }

  equalsValue(other: Money): boolean {
    return this.amountInCents === other.amountInCents;
  }

  isGreaterThan(other: Money): boolean {
    return this.amountInCents > other.amountInCents;
  }

  isLessThan(other: Money): boolean {
    return this.amountInCents < other.amountInCents;
  }
}
