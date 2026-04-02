import { ValueObject } from "../../../../../shared/entities/value-object";

export type ServiceNameProps = {
  value: string;
};

export class InvalidServiceNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidServiceNameError";
  }
}

export class ServiceName extends ValueObject<ServiceNameProps> {
  private constructor(props: ServiceNameProps) {
    super(props);
  }

  static create(value: string) {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new InvalidServiceNameError("Service name cannot be empty");
    }

    if (normalizedValue.length > 72) {
      throw new InvalidServiceNameError(
        "Service name should be shorter: max 72 characters.",
      );
    }

    const serviceName = new ServiceName({ value: normalizedValue });

    return serviceName;
  }

  get value() {
    return this.props.value;
  }

  toString() {
    return this.props.value;
  }
}
