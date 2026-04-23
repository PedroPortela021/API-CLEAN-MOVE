import type {
  Prisma,
  PasswordResetToken as PrismaPasswordResetToken,
} from "../../../../generated/prisma/client";
import { PasswordResetToken } from "../../../../modules/accounts/domain/entities/password-reset-token";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";

export class PrismaPasswordResetTokenMapper {
  static toDomain(raw: PrismaPasswordResetToken): PasswordResetToken {
    return PasswordResetToken.create(
      {
        userId: new UniqueEntityId(raw.userId),
        hashedCode: raw.hashedCode,
        expiresAt: raw.expiresAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(
    token: PasswordResetToken,
  ): Prisma.PasswordResetTokenUncheckedCreateInput {
    return {
      id: token.id.toString(),
      userId: token.userId.toString(),
      hashedCode: token.hashedCode,
      expiresAt: token.expiresAt,
    };
  }
}
