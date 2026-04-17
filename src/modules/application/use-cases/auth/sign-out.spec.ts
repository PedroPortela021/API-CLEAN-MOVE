import { SessionCreationService } from "../../../accounts/domain/services/session-creation-service";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { makeUser } from "../../../../../tests/factories/user-factory";
import { InMemorySessionsRepository } from "../../../../../tests/repositories/in-memory-sessions-repository";
import { SignOutUseCase } from "./sign-out";

describe("SignOutUseCase", () => {
  let inMemorySessionsRepository: InMemorySessionsRepository;
  let sessionCreationService: SessionCreationService;
  let sut: SignOutUseCase;

  beforeEach(() => {
    inMemorySessionsRepository = new InMemorySessionsRepository();
    sessionCreationService = new SessionCreationService();
    sut = new SignOutUseCase(inMemorySessionsRepository);
  });

  it("should revoke a session that belongs to the authenticated user", async () => {
    const user = makeUser("CUSTOMER");
    const session = sessionCreationService.execute({
      userId: user.id,
      refreshTokenHash: "refresh-token-hash",
      ttlInMs: 1000 * 60 * 60 * 24 * 15,
      referenceDate: new Date("2026-04-17T12:00:00.000Z"),
    });

    await inMemorySessionsRepository.create(session);

    const result = await sut.execute({
      userId: user.id.toString(),
      sessionId: session.id.toString(),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value).toEqual({ ok: true });
    expect(session.isRevoked()).toBe(true);
    expect(session.revokedAt).not.toBeNull();
  });

  it("should return resource not found when the session does not exist", async () => {
    const result = await sut.execute({
      userId: new UniqueEntityId().toString(),
      sessionId: new UniqueEntityId().toString(),
    });

    expect(result.isLeft()).toBe(true);

    if (result.isRight()) {
      throw new Error("Expected sign-out to fail for an unknown session.");
    }

    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(result.value.message).toBe("Resource not found: session.");
  });

  it("should return resource not found when the session belongs to another user", async () => {
    const sessionOwner = makeUser("CUSTOMER");
    const otherUser = makeUser("CUSTOMER");
    const session = sessionCreationService.execute({
      userId: sessionOwner.id,
      refreshTokenHash: "refresh-token-hash",
      ttlInMs: 1000 * 60 * 60 * 24 * 15,
    });

    await inMemorySessionsRepository.create(session);

    const result = await sut.execute({
      userId: otherUser.id.toString(),
      sessionId: session.id.toString(),
    });

    expect(result.isLeft()).toBe(true);

    if (result.isRight()) {
      throw new Error(
        "Expected sign-out to fail for a session from another user.",
      );
    }

    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(result.value.message).toBe(
      "Resource not found: session by this user.",
    );
    expect(session.isRevoked()).toBe(false);
  });

  it("should keep sign-out idempotent when the session is already revoked", async () => {
    const user = makeUser("CUSTOMER");
    const revokeDate = new Date("2026-04-17T12:30:00.000Z");
    const session = sessionCreationService.execute({
      userId: user.id,
      refreshTokenHash: "refresh-token-hash",
      ttlInMs: 1000 * 60 * 60 * 24 * 15,
      referenceDate: new Date("2026-04-17T12:00:00.000Z"),
    });

    session.revoke(revokeDate);
    await inMemorySessionsRepository.create(session);

    const result = await sut.execute({
      userId: user.id.toString(),
      sessionId: session.id.toString(),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value).toEqual({ ok: true });
    expect(session.isRevoked()).toBe(true);
    expect(session.revokedAt).toEqual(revokeDate);
    expect(session.updatedAt).toEqual(revokeDate);
  });
});
