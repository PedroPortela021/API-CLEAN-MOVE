import { Injectable } from "@nestjs/common";
import { EstablishmentsRepository } from "../../../../modules/application/repositories/establishment-repository";
import { ServiceCategory } from "../../../../modules/catalog/domain/value-objects/service-category";
import { Establishment } from "../../../../modules/establishments/domain/entities/establishment";
import { PrismaService } from "../prisma.service";
import { PrismaEstablishmentMapper } from "../mappers/prisma-establishment-mapper";

@Injectable()
export class PrismaEstablishmentRepository implements EstablishmentsRepository {
  constructor(private prisma: PrismaService) {}

  async create(establishment: Establishment): Promise<void> {
    const data = PrismaEstablishmentMapper.toPrisma(establishment);

    await this.prisma.establishment.create({
      data,
    });
  }

  async findByCnpj(cnpj: string): Promise<Establishment | null> {
    const establishment = await this.prisma.establishment.findUnique({
      where: {
        cnpj,
      },
    });

    if (!establishment) return null;

    return PrismaEstablishmentMapper.toDomain(establishment);
  }

  async findById(id: string): Promise<Establishment | null> {
    throw new Error();
  }
  async findBySlug(slug: string): Promise<Establishment | null> {
    throw new Error();
  }
  async findBySlugAndCnpj(
    cnpj: string,
    slug: string,
  ): Promise<Establishment | null> {
    throw new Error();
  }
  async findMany(filters?: {
    establishmentName?: string;
    serviceCategory?: ServiceCategory;
  }): Promise<Establishment[]> {
    throw new Error();
  }
}
