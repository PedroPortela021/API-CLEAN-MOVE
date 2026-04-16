import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { InvalidSessionCreationError } from "../errors/invalid-session-creation-error";
import { SessionCreationService } from "./session-creation-service";

describe("SessionCreationService", () => {
  it("should create a valid session with future expiration", () => {
    const sut = new SessionCreationService();
    const referenceDate = new Date("2026-04-16T10:00:00.000Z");

    const session = sut.execute({
      userId: new UniqueEntityId("0f67d8c0-f532-4f74-9045-c5547d6c8f11"),
      refreshTokenHash: "refresh-token-hash",
      ttlInMs: 1000 * 60 * 60 * 24 * 30,
      referenceDate,
    });

    expect(session.isRevoked()).toBe(false);
    expect(session.isExpired(referenceDate)).toBe(false);
    expect(session.createdAt).toEqual(referenceDate);
    expect(session.updatedAt).toEqual(referenceDate);
    expect(session.expiresAt).toEqual(
      new Date("2026-05-16T10:00:00.000Z"),
    );
    expect(session.lastUsedAt).toBeNull();
    expect(session.userAgent).toBeNull();
    expect(session.ipAddress).toBeNull();
  });

  it("should normalize optional metadata", () => {
    const sut = new SessionCreationService();

    const session = sut.execute({
      userId: new UniqueEntityId(),
      refreshTokenHash: "  refresh-token-hash  ",
      ttlInMs: 1000,
      userAgent: "  Mozilla/5.0  ",
      ipAddress: "  127.0.0.1  ",
    });

    expect(session.refreshTokenHash).toBe("refresh-token-hash");
    expect(session.userAgent).toBe("Mozilla/5.0");
    expect(session.ipAddress).toBe("127.0.0.1");
  });

  it("should throw when refreshTokenHash is empty", () => {
    const sut = new SessionCreationService();

    expect(() =>
      sut.execute({
        userId: new UniqueEntityId(),
        refreshTokenHash: "   ",
        ttlInMs: 1000,
      }),
    ).toThrow(InvalidSessionCreationError);
  });

  it("should throw when ttlInMs is invalid", () => {
    const sut = new SessionCreationService();

    expect(() =>
      sut.execute({
        userId: new UniqueEntityId(),
        refreshTokenHash: "refresh-token-hash",
        ttlInMs: 0,
      }),
    ).toThrow(InvalidSessionCreationError);
  });
});
