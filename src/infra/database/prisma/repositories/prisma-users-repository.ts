import { Injectable } from "@nestjs/common";
import { User } from "../../../../modules/accounts/domain/entities/user";
import { OAuthProvider } from "../../../../modules/accounts/domain/value-objects/oauth-provider";
import { UsersRepository } from "../../../../modules/application/repositories/users-repository";
import { PrismaUserMapper } from "../mappers/prisma-user-mapper";
import { PrismaUnitOfWork } from "../prisma-unit-of-work";
import { rethrowPrismaRepositoryError } from "../prisma-repository-error-handler";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private prisma: PrismaService) {}

  async create(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user);

    try {
      await PrismaUnitOfWork.getClient(this.prisma).user.create({
        data,
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).user.findUnique({
        where: {
          email,
        },
      });

      if (!user) return null;

      return PrismaUserMapper.toDomain(user);
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findById(_userId: string): Promise<User | null> {
    void _userId;
    throw new Error();
  }

  async findByProviderAndSubject(
    _provider: OAuthProvider,
    _subjectId: string,
  ): Promise<User | null> {
    void _provider;
    void _subjectId;
    throw new Error();
  }

  async save(_user: User): Promise<void> {
    void _user;
  }
}
