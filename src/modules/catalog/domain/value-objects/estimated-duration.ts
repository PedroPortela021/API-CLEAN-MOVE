import { ValueObject } from "../../../../shared/entities/value-object";

type EstimatedDurationProps = {
  minInMinutes: number;
  maxInMinutes: number;
};

export class InvalidEstimatedDurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidEstimatedDurationError";
  }
}

export class EstimatedDuration extends ValueObject<EstimatedDurationProps> {
  private constructor(props: EstimatedDurationProps) {
    super(props);
  }

  static create(props: {
    minInMinutes: number;
    maxInMinutes?: number;
  }): EstimatedDuration {
    const minInMinutes = props.minInMinutes;
    const maxInMinutes = props.maxInMinutes ?? props.minInMinutes;

    this.validate(minInMinutes, "minInMinutes");
    this.validate(maxInMinutes, "maxInMinutes");

    if (minInMinutes > maxInMinutes) {
      throw new InvalidEstimatedDurationError(
        "minInMinutes cannot be greater than maxInMinutes.",
      );
    }

    return new EstimatedDuration({
      minInMinutes,
      maxInMinutes,
    });
  }

  get minInMinutes() {
    return this.props.minInMinutes;
  }

  get maxInMinutes() {
    return this.props.maxInMinutes;
  }

  get averageInMinutes() {
    return Math.round((this.minInMinutes + this.maxInMinutes) / 2);
  }

  get isRange() {
    return this.minInMinutes !== this.maxInMinutes;
  }

  get formatted() {
    if (!this.isRange) {
      return `${this.minInMinutes} min`;
    }

    return `${this.minInMinutes} - ${this.maxInMinutes} min`;
  }

  toString() {
    return this.formatted;
  }

  private static validate(value: number, field: string) {
    if (!Number.isInteger(value)) {
      throw new InvalidEstimatedDurationError(
        `${field} must be an integer.`,
      );
    }

    if (value <= 0) {
      throw new InvalidEstimatedDurationError(
        `${field} must be greater than zero.`,
      );
    }
  }
}
