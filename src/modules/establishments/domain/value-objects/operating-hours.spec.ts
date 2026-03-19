import { InvalidOperatingHoursError, OperatingHours } from "./operating-hours";

describe("OperatingHours", () => {
  it("should be able to create valid operating hours", () => {
    const operatingHours = OperatingHours.create({
      days: [
        {
          day: "MONDAY",
          ranges: [
            { start: "08:00", end: "12:00" },
            { start: "13:00", end: "18:00" },
          ],
        },
        {
          day: "SUNDAY",
          ranges: [],
        },
      ],
    });

    expect(operatingHours.days).toHaveLength(2);
  });

  it("should not allow invalid HH:mm values", () => {
    expect(() =>
      OperatingHours.create({
        days: [
          {
            day: "MONDAY",
            ranges: [{ start: "8:00", end: "18:00" }],
          },
        ],
      }),
    ).toThrow(InvalidOperatingHoursError);
  });

  it("should not allow a start time greater than or equal to the end time", () => {
    expect(() =>
      OperatingHours.create({
        days: [
          {
            day: "MONDAY",
            ranges: [{ start: "18:00", end: "08:00" }],
          },
        ],
      }),
    ).toThrow("Start time must be earlier than end time for MONDAY");

    expect(() =>
      OperatingHours.create({
        days: [
          {
            day: "TUESDAY",
            ranges: [{ start: "08:00", end: "08:00" }],
          },
        ],
      }),
    ).toThrow("Start time must be earlier than end time for TUESDAY");
  });

  it("should not allow overlapping ranges on the same day", () => {
    expect(() =>
      OperatingHours.create({
        days: [
          {
            day: "MONDAY",
            ranges: [
              { start: "08:00", end: "12:00" },
              { start: "11:00", end: "18:00" },
            ],
          },
        ],
      }),
    ).toThrow("Overlapping time ranges are not allowed for MONDAY");
  });

  it("should not allow duplicated days", () => {
    expect(() =>
      OperatingHours.create({
        days: [
          {
            day: "MONDAY",
            ranges: [{ start: "08:00", end: "12:00" }],
          },
          {
            day: "MONDAY",
            ranges: [{ start: "13:00", end: "18:00" }],
          },
        ],
      }),
    ).toThrow("Duplicated day is not allowed: MONDAY");
  });
});
