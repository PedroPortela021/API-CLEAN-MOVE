import {
  EstimatedDuration,
  InvalidEstimatedDurationError,
} from "./estimated-duration";

describe("EstimatedDuration", () => {
  it("should be able to create a range duration", () => {
    const duration = EstimatedDuration.create({
      minInMinutes: 30,
      maxInMinutes: 60,
    });

    expect(duration.minInMinutes).toBe(30);
    expect(duration.maxInMinutes).toBe(60);
    expect(duration.averageInMinutes).toBe(45);
    expect(duration.formatted).toBe("30 - 60 min");
  });

  it("should be able to create an exact duration", () => {
    const duration = EstimatedDuration.create({
      minInMinutes: 30,
    });

    expect(duration.minInMinutes).toBe(30);
    expect(duration.maxInMinutes).toBeNull();
    expect(duration.upperBoundInMinutes).toBe(30);
    expect(duration.averageInMinutes).toBe(30);
    expect(duration.formatted).toBe("30 min");
  });

  it("should not allow min greater than max", () => {
    expect(() =>
      EstimatedDuration.create({
        minInMinutes: 60,
        maxInMinutes: 30,
      }),
    ).toThrow(InvalidEstimatedDurationError);
  });
});
