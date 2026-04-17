import { Injectable } from "@nestjs/common";
import { Session } from "../../../../modules/accounts/domain/entities/session";
import { SessionsRepository } from "../../../../modules/application/repositories/sessions-repository";
import { PrismaSessionMapper } from "../mappers/prisma-session-mapper";
import { PrismaUnitOfWork } from "../prisma-unit-of-work";
import { rethrowPrismaRepositoryError } from "../prisma-repository-error-handler";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaSessionsRepository implements SessionsRepository {
  constructor(private prisma: PrismaService) {}

  async create(session: Session): Promise<void> {
    const data = PrismaSessionMapper.toPrisma(session);

    try {
      await PrismaUnitOfWork.getClient(this.prisma).session.create({
        data,
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findById(id: string): Promise<Session | null> {
    try {
      const session = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).session.findUnique({
        where: {
          id,
        },
      });

      if (!session) {
        return null;
      }

      return PrismaSessionMapper.toDomain(session);
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findManyByUserId(userId: string): Promise<Session[]> {
    try {
      const sessions = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).session.findMany({
        where: {
          userId,
        },
      });

      return sessions.map((session) => PrismaSessionMapper.toDomain(session));
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async save(session: Session): Promise<void> {
    const data = PrismaSessionMapper.toPrismaUpdate(session);

    try {
      await PrismaUnitOfWork.getClient(this.prisma).session.update({
        where: {
          id: session.id.toString(),
        },
        data,
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      await PrismaUnitOfWork.getClient(this.prisma).session.deleteMany({
        where: {
          id,
        },
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }
}
