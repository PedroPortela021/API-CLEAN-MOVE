import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Session } from "../entities/session";
import { InvalidSessionCreationError } from "../errors/invalid-session-creation-error";

export type SessionCreationServiceRequest = {
  userId: UniqueEntityId;
  refreshTokenHash: string;
  ttlInMs: number;
  userAgent?: string | null;
  ipAddress?: string | null;
  referenceDate?: Date;
};

export class SessionCreationService {
  execute({
    userId,
    refreshTokenHash,
    ttlInMs,
    userAgent,
    ipAddress,
    referenceDate = new Date(),
  }: SessionCreationServiceRequest): Session {
    if (!(userId instanceof UniqueEntityId)) {
      throw new InvalidSessionCreationError("Invalid userId.");
    }

    const normalizedRefreshTokenHash = refreshTokenHash.trim();

    if (!normalizedRefreshTokenHash) {
      throw new InvalidSessionCreationError(
        "refreshTokenHash cannot be empty.",
      );
    }

    if (!Number.isFinite(ttlInMs) || ttlInMs <= 0) {
      throw new InvalidSessionCreationError("ttlInMs must be greater than zero.");
    }

    const normalizedUserAgent = userAgent?.trim() || null;
    const normalizedIpAddress = ipAddress?.trim() || null;
    const expiresAt = new Date(referenceDate.getTime() + ttlInMs);

    return Session.create({
      userId,
      refreshTokenHash: normalizedRefreshTokenHash,
      expiresAt,
      createdAt: referenceDate,
      updatedAt: referenceDate,
      userAgent: normalizedUserAgent,
      ipAddress: normalizedIpAddress,
    });
  }
}
