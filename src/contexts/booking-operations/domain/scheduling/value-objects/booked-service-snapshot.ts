import { ValueObject } from "../../../../../shared/entities/value-object";
import { UniqueEntityId } from "../../../../../shared/entities/unique-entity-id";

export type BookedServiceSnapshotProps = {
  serviceId: UniqueEntityId;
  serviceName: string;
  durationInMinutes: number;
  priceInCents: number;
};

export class InvalidBookedServiceSnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBookedServiceSnapshotError";
  }
}

export class BookedServiceSnapshot extends ValueObject<BookedServiceSnapshotProps> {
  private constructor(props: BookedServiceSnapshotProps) {
    super(props);
  }

  get serviceId() {
    return this.props.serviceId;
  }

  get serviceName() {
    return this.props.serviceName;
  }

  get durationInMinutes() {
    return this.props.durationInMinutes;
  }

  get priceInCents() {
    return this.props.priceInCents;
  }

  get price() {
    return this.props.priceInCents / 100;
  }

  static create(props: BookedServiceSnapshotProps) {
    const serviceName = props.serviceName.trim();

    if (!(props.serviceId instanceof UniqueEntityId)) {
      throw new InvalidBookedServiceSnapshotError("Invalid serviceId.");
    }

    if (!serviceName) {
      throw new InvalidBookedServiceSnapshotError(
        "Service name cannot be empty.",
      );
    }

    if (serviceName.length > 72) {
      throw new InvalidBookedServiceSnapshotError(
        "Service name should be shorter: max 72 characters.",
      );
    }

    if (!Number.isInteger(props.durationInMinutes)) {
      throw new InvalidBookedServiceSnapshotError(
        "durationInMinutes must be an integer.",
      );
    }

    if (props.durationInMinutes <= 0) {
      throw new InvalidBookedServiceSnapshotError(
        "durationInMinutes must be greater than zero.",
      );
    }

    if (!Number.isInteger(props.priceInCents)) {
      throw new InvalidBookedServiceSnapshotError(
        "priceInCents must be an integer.",
      );
    }

    if (props.priceInCents < 0) {
      throw new InvalidBookedServiceSnapshotError(
        "priceInCents cannot be negative.",
      );
    }

    const bookedServiceSnapshot = new BookedServiceSnapshot({
      ...props,
      serviceName,
    });

    return bookedServiceSnapshot;
  }
}
