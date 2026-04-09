// import { EstablishmentsRepository } from "../../../../modules/application/repositories/establishment-repository";
// import { ServiceCategory } from "../../../../modules/catalog/domain/value-objects/service-category";
// import { Establishment } from "../../../../modules/establishments/domain/entities/establishment";
// import { PrismaService } from "../prisma.service";

// export class PrismaEstablishmentRepository implements EstablishmentsRepository {
//   constructor(private prisma: PrismaService) {}

//   async create(data: Establishment): Promise<void> {}
//   async findByCnpj(cnpj: string): Promise<Establishment | null> {}
//   async findById(id: string): Promise<Establishment | null> {}
//   async findBySlug(slug: string): Promise<Establishment | null> {}
//   async findBySlugAndCnpj(
//     cnpj: string,
//     slug: string,
//   ): Promise<Establishment | null> {}
//   async findMany(filters?: {
//     establishmentName?: string;
//     serviceCategory?: ServiceCategory;
//   }): Promise<Establishment[]> {}
// }
