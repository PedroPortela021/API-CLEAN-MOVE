import { InvalidTimeSlotError, TimeSlot } from "./time-slot";

describe("TimeSlot", () => {
  it("should be able to create a valid time slot", () => {
    const startsAt = new Date("2026-04-01T10:00:00.000Z");
    const endsAt = new Date("2026-04-01T11:30:00.000Z");

    const timeSlot = TimeSlot.create({
      startsAt,
      endsAt,
    });

    expect(timeSlot.startsAt).toBe(startsAt);
    expect(timeSlot.endsAt).toBe(endsAt);
    expect(timeSlot.durationInMinutes).toBe(90);
  });

  it("should not allow an invalid startsAt date", () => {
    expect(() =>
      TimeSlot.create({
        startsAt: new Date("invalid"),
        endsAt: new Date("2026-04-01T11:30:00.000Z"),
      }),
    ).toThrow(InvalidTimeSlotError);
  });

  it("should not allow an invalid endsAt date", () => {
    expect(() =>
      TimeSlot.create({
        startsAt: new Date("2026-04-01T10:00:00.000Z"),
        endsAt: new Date("invalid"),
      }),
    ).toThrow(InvalidTimeSlotError);
  });

  it("should not allow endsAt less than or equal to startsAt", () => {
    expect(() =>
      TimeSlot.create({
        startsAt: new Date("2026-04-01T10:00:00.000Z"),
        endsAt: new Date("2026-04-01T10:00:00.000Z"),
      }),
    ).toThrow("endsAt must be greater than startsAt.");

    expect(() =>
      TimeSlot.create({
        startsAt: new Date("2026-04-01T10:00:00.000Z"),
        endsAt: new Date("2026-04-01T09:59:00.000Z"),
      }),
    ).toThrow("endsAt must be greater than startsAt.");
  });

  it("should detect overlapping time slots", () => {
    const current = TimeSlot.create({
      startsAt: new Date("2026-04-01T10:00:00.000Z"),
      endsAt: new Date("2026-04-01T11:00:00.000Z"),
    });

    const overlapping = TimeSlot.create({
      startsAt: new Date("2026-04-01T10:30:00.000Z"),
      endsAt: new Date("2026-04-01T11:30:00.000Z"),
    });

    const adjacent = TimeSlot.create({
      startsAt: new Date("2026-04-01T11:00:00.000Z"),
      endsAt: new Date("2026-04-01T12:00:00.000Z"),
    });

    expect(current.overlapsWith(overlapping)).toBe(true);
    expect(current.overlapsWith(adjacent)).toBe(false);
  });

  it("should check whether a date is contained in the time slot", () => {
    const timeSlot = TimeSlot.create({
      startsAt: new Date("2026-04-01T10:00:00.000Z"),
      endsAt: new Date("2026-04-01T11:00:00.000Z"),
    });

    expect(timeSlot.contains(new Date("2026-04-01T10:00:00.000Z"))).toBe(true);
    expect(timeSlot.contains(new Date("2026-04-01T10:30:00.000Z"))).toBe(true);
    expect(timeSlot.contains(new Date("2026-04-01T11:00:00.000Z"))).toBe(false);
  });

  it("should not allow an invalid date in contains", () => {
    const timeSlot = TimeSlot.create({
      startsAt: new Date("2026-04-01T10:00:00.000Z"),
      endsAt: new Date("2026-04-01T11:00:00.000Z"),
    });

    expect(() => timeSlot.contains(new Date("invalid"))).toThrow(
      InvalidTimeSlotError,
    );
  });

  it("should compare ranges", () => {
    const first = TimeSlot.create({
      startsAt: new Date("2026-04-01T10:00:00.000Z"),
      endsAt: new Date("2026-04-01T11:00:00.000Z"),
    });

    const second = TimeSlot.create({
      startsAt: new Date("2026-04-01T10:30:00.000Z"),
      endsAt: new Date("2026-04-01T10:45:00.000Z"),
    });

    const equalToFirst = TimeSlot.create({
      startsAt: new Date("2026-04-01T10:00:00.000Z"),
      endsAt: new Date("2026-04-01T11:00:00.000Z"),
    });

    expect(first.startsBefore(second)).toBe(true);
    expect(first.endsAfter(second)).toBe(true);
    expect(first.isSameRangeAs(equalToFirst)).toBe(true);
    expect(first.isSameRangeAs(second)).toBe(false);
  });
});
