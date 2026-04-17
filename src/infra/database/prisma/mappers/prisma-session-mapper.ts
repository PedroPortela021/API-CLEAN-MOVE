import type {
  Prisma,
  Session as PrismaSession,
} from "../../../../generated/prisma/client";
import { Session } from "../../../../modules/accounts/domain/entities/session";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";

export class PrismaSessionMapper {
  static toDomain(raw: PrismaSession): Session {
    return Session.create(
      {
        userId: new UniqueEntityId(raw.userId),
        refreshTokenHash: raw.refreshTokenHash,
        expiresAt: raw.expiresAt,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        revokedAt: raw.revokedAt,
        lastUsedAt: raw.lastUsedAt,
        userAgent: raw.userAgent,
        ipAddress: raw.ipAddress,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(raw: Session): Prisma.SessionUncheckedCreateInput {
    return {
      id: raw.id.toString(),
      userId: raw.userId.toString(),
      refreshTokenHash: raw.refreshTokenHash,
      expiresAt: raw.expiresAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      revokedAt: raw.revokedAt,
      lastUsedAt: raw.lastUsedAt,
      userAgent: raw.userAgent,
      ipAddress: raw.ipAddress,
    };
  }

  static toPrismaUpdate(raw: Session): Prisma.SessionUncheckedUpdateInput {
    return {
      userId: raw.userId.toString(),
      refreshTokenHash: raw.refreshTokenHash,
      expiresAt: raw.expiresAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      revokedAt: raw.revokedAt,
      lastUsedAt: raw.lastUsedAt,
      userAgent: raw.userAgent,
      ipAddress: raw.ipAddress,
    };
  }
}
