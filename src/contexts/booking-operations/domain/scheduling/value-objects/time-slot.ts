import { ValueObject } from "../../../../../shared/entities/value-object";

type TimeSlotProps = {
  startsAt: Date;
  endsAt: Date;
};

export class InvalidTimeSlotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTimeSlotError";
  }
}

export class TimeSlot extends ValueObject<TimeSlotProps> {
  private constructor(props: TimeSlotProps) {
    super(props);
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get endsAt(): Date {
    return this.props.endsAt;
  }

  get durationInMinutes(): number {
    const diffInMs = this.endsAt.getTime() - this.startsAt.getTime();
    return Math.floor(diffInMs / 1000 / 60);
  }

  static create(props: TimeSlotProps): TimeSlot {
    const { startsAt, endsAt } = props;

    if (!(startsAt instanceof Date) || Number.isNaN(startsAt.getTime())) {
      throw new InvalidTimeSlotError("Invalid startsAt date.");
    }

    if (!(endsAt instanceof Date) || Number.isNaN(endsAt.getTime())) {
      throw new InvalidTimeSlotError("Invalid endsAt date.");
    }

    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new InvalidTimeSlotError("endsAt must be greater than startsAt.");
    }

    return new TimeSlot({
      startsAt,
      endsAt,
    });
  }

  overlapsWith(other: TimeSlot): boolean {
    return this.startsAt < other.endsAt && this.endsAt > other.startsAt;
  }

  contains(date: Date): boolean {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new InvalidTimeSlotError("Invalid date.");
    }

    return date >= this.startsAt && date < this.endsAt;
  }

  startsBefore(other: TimeSlot): boolean {
    return this.startsAt.getTime() < other.startsAt.getTime();
  }

  endsAfter(other: TimeSlot): boolean {
    return this.endsAt.getTime() > other.endsAt.getTime();
  }

  isSameRangeAs(other: TimeSlot): boolean {
    return (
      this.startsAt.getTime() === other.startsAt.getTime() &&
      this.endsAt.getTime() === other.endsAt.getTime()
    );
  }
}
