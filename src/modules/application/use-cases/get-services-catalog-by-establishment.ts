import { Either, left, right } from "../../../shared/either";
import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { PaginationParams } from "../../../shared/types/pagination-params";
import { Service } from "../../catalog/domain/entities/services";
import { ServiceCategory } from "../../catalog/domain/value-objects/service-category";
import { EstablishmentsRepository } from "../repositories/establishment-repository";
import { ServicesRepository } from "../repositories/services-repository";

type GetServiceCatalogByEstablishmentUseCaseRequest = {
  establishmentId: string;
  filters?: {
    serviceName?: string;
    category?: ServiceCategory;
    minPrice?: number;
    maxPrice?: number;
  } & PaginationParams;
};

type GetServiceCatalogByEstablishmentUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    services: Service[];
  }
>;

export class GetServiceCatalogByEstablishmentUseCase {
  constructor(
    private servicesRepository: ServicesRepository,
    private establishmentsRepository: EstablishmentsRepository,
  ) {}

  async execute({
    establishmentId,
    filters,
  }: GetServiceCatalogByEstablishmentUseCaseRequest): Promise<GetServiceCatalogByEstablishmentUseCaseResponse> {
    const establishment =
      await this.establishmentsRepository.findById(establishmentId);

    if (!establishment) {
      return left(new ResourceNotFoundError("establishment"));
    }

    const services = await this.servicesRepository.findManyByEstablishmentId(
      establishment.id.toString(),
      filters,
    );

    return right({
      services,
    });
  }
}
