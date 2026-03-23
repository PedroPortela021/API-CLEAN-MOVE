import { Either, left, right } from "../../../shared/either";
import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { Service } from "../../catalog/domain/entities/services";
import { ServiceCategory } from "../../catalog/domain/value-objects/category";
import { EstimatedDuration } from "../../catalog/domain/value-objects/estimated-duration";
import { Money } from "../../catalog/domain/value-objects/money";
import { EstablishmentsRepository } from "../repositories/establishment-repository";
import { ServicesRepository } from "../repositories/services-repository";

type CreateServiceUseCaseRequest = {
  establishmentId: string;
  serviceName: string;
  description: string;
  category: ServiceCategory;
  estimatedDuration: {
    minInMinutes: number;
    maxInMinutes?: number;
  };
  price: number;
  isActive?: boolean;
};

type CreateServiceUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    service: Service;
  }
>;

export class CreateServiceUseCase {
  constructor(
    private servicesRepository: ServicesRepository,
    private establishmentsRepository: EstablishmentsRepository,
  ) {}

  async execute({
    establishmentId,
    serviceName,
    description,
    category,
    estimatedDuration,
    price,
    isActive = true,
  }: CreateServiceUseCaseRequest): Promise<CreateServiceUseCaseResponse> {
    const establishment =
      await this.establishmentsRepository.findById(establishmentId);

    if (!establishment) {
      return left(new ResourceNotFoundError("Establishment"));
    }

    const service = Service.create({
      establishmentId: establishment.id,
      serviceName,
      description,
      category,
      price: Money.create(price),
      estimatedDuration: EstimatedDuration.create(estimatedDuration),
      isActive,
    });

    await this.servicesRepository.create(service);

    return right({
      service,
    });
  }
}
