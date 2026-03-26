import { Either, left, right } from "../../../shared/either";
import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { UnexpectedDomainError } from "../../../shared/errors/unexpected-domain-error";
import { Service } from "../../catalog/domain/entities/services";
import { InvalidEstimatedDurationTransitionError } from "../../catalog/domain/errors/invalid-estimated-duration-transition-error";
import {
  EstimatedDuration,
  InvalidEstimatedDurationError,
} from "../../catalog/domain/value-objects/estimated-duration";
import {
  InvalidMoneyError,
  Money,
} from "../../catalog/domain/value-objects/money";
import { ServiceCategory } from "../../catalog/domain/value-objects/service-category";
import {
  InvalidServiceNameError,
  ServiceName,
} from "../../catalog/domain/value-objects/service-name";
import { EstablishmentsRepository } from "../repositories/establishment-repository";
import { ServicesRepository } from "../repositories/services-repository";
import { InvalidServiceUpdateInputError } from "./update-service";

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
  ResourceNotFoundError | InvalidServiceUpdateInputError,
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

    let service;

    try {
      service = Service.create({
        establishmentId: establishment.id,
        serviceName: ServiceName.create(serviceName),
        description,
        category,
        price: Money.create(price),
        estimatedDuration: EstimatedDuration.create(estimatedDuration),
        isActive,
      });
    } catch (error) {
      if (
        error instanceof InvalidServiceNameError ||
        error instanceof InvalidEstimatedDurationError ||
        error instanceof InvalidMoneyError ||
        error instanceof InvalidEstimatedDurationTransitionError
      ) {
        return left(new InvalidServiceUpdateInputError(error.message));
      }
      return left(new UnexpectedDomainError());
    }

    await this.servicesRepository.create(service);

    return right({
      service,
    });
  }
}
