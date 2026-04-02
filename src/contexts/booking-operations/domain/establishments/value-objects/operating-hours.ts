import { ValueObject } from "../../../../../shared/entities/value-object";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type TimeRange = {
  start: string;
  end: string;
};

export type OpeningDay = {
  day: DayOfWeek;
  ranges: TimeRange[];
};

export type OperatingHoursProps = {
  days: OpeningDay[];
};

export class InvalidOperatingHoursError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOperatingHoursError";
  }
}

export class OperatingHours extends ValueObject<OperatingHoursProps> {
  private constructor(props: OperatingHoursProps) {
    super(props);
  }

  static create(props: OperatingHoursProps) {
    const seenDays = new Set<DayOfWeek>();

    for (const openingDay of props.days) {
      if (seenDays.has(openingDay.day)) {
        throw new InvalidOperatingHoursError(
          `Duplicated day is not allowed: ${openingDay.day}`,
        );
      }

      seenDays.add(openingDay.day);
      this.validateRanges(openingDay);
    }

    return new OperatingHours({
      days: props.days.map((openingDay) => ({
        day: openingDay.day,
        ranges: openingDay.ranges.map((range) => ({
          start: range.start,
          end: range.end,
        })),
      })),
    });
  }

  get days() {
    return this.props.days;
  }

  private static validateRanges(openingDay: OpeningDay) {
    const sortedRanges = [...openingDay.ranges].sort((a, b) => {
      return this.toMinutes(a.start) - this.toMinutes(b.start);
    });

    let previousRangeEnd: number | null = null;

    for (const range of sortedRanges) {
      const start = this.toMinutes(range.start);
      const end = this.toMinutes(range.end);

      if (start >= end) {
        throw new InvalidOperatingHoursError(
          `Start time must be earlier than end time for ${openingDay.day}`,
        );
      }

      if (previousRangeEnd !== null && start < previousRangeEnd) {
        throw new InvalidOperatingHoursError(
          `Overlapping time ranges are not allowed for ${openingDay.day}`,
        );
      }

      previousRangeEnd = end;
    }
  }

  private static toMinutes(value: string) {
    if (!this.isValidTimeFormat(value)) {
      throw new InvalidOperatingHoursError(
        `Invalid time format: ${value}. Expected HH:mm`,
      );
    }

    const [hours, minutes] = value.split(":").map(Number);

    if (hours === undefined || minutes === undefined) {
      throw new InvalidOperatingHoursError(
        `Invalid time format: ${value}. Expected HH:mm`,
      );
    }

    return hours * 60 + minutes;
  }

  private static isValidTimeFormat(value: string) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
  }
}
