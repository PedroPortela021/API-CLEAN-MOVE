export class Email {
  private readonly value: string;

  private static readonly regexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Constructs an Email value object.
   * @param value The email string to validate and encapsulate.
   * @throws Error if the email is invalid.
   */
  constructor(value: string) {
    if (!Email.isValid(value)) {
      throw new Error(`Invalid email address: ${value}`);
    }
    this.value = value;
  }

  public static isValid(value: string): boolean {
    return this.regexPattern.test(value);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return other.getValue() === this.value;
  }

  public toString(): string {
    return this.value;
  }
}
