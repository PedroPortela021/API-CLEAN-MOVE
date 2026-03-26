import { Either, left, right } from "../../../shared/either";
import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { NotAllowed } from "../../../shared/errors/not-allowed";
import { Service } from "../../catalog/domain/entities/services";
import { ServiceCategory } from "../../catalog/domain/value-objects/service-category";
import { EstablishmentsRepository } from "../repositories/establishment-repository";
import { ServicesRepository } from "../repositories/services-repository";
import { NoUpdateFieldsProvidedError } from "../../../shared/errors/no-update-field-provided-error";
import { InvalidServiceNameError } from "../../catalog/domain/value-objects/service-name";
import { InvalidEstimatedDurationError } from "../../catalog/domain/value-objects/estimated-duration";
import { InvalidMoneyError } from "../../catalog/domain/value-objects/money";
import { InvalidEstimatedDurationTransitionError } from "../../catalog/domain/errors/invalid-estimated-duration-transition-error";
import { UnexpectedDomainError } from "../../../shared/errors/unexpected-domain-error";

type UpdateServiceUseCaseRequest = {
  establishmentId: string;
  serviceId: string;
  data: {
    serviceName?: string;
    description?: string;
    category?: ServiceCategory;
    estimatedDuration?: {
      minInMinutes: number;
      maxInMinutes?: number;
    };
    price?: number;
  };
};

type UpdateServiceUseCaseResponse = Either<
  | NoUpdateFieldsProvidedError
  | ResourceNotFoundError
  | NotAllowed
  | InvalidServiceUpdateInputError,
  {
    service: Service;
  }
>;

export class InvalidServiceUpdateInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidServiceUpdateInputError";
  }
}

export class UpdateServiceUseCase {
  constructor(
    private servicesRepository: ServicesRepository,
    private establishmentsRepository: EstablishmentsRepository,
  ) {}

  async execute({
    establishmentId,
    serviceId,
    data,
  }: UpdateServiceUseCaseRequest): Promise<UpdateServiceUseCaseResponse> {
    let hasAnyFieldToUpdate = false;

    for (const field in data) {
      if (data[field as keyof typeof data] !== undefined) {
        hasAnyFieldToUpdate = true;
        break;
      }
    }

    if (!hasAnyFieldToUpdate) {
      return left(new NoUpdateFieldsProvidedError());
    }

    const establishment =
      await this.establishmentsRepository.findById(establishmentId);

    if (!establishment) {
      return left(new ResourceNotFoundError());
    }

    const serviceToUpdate = await this.servicesRepository.findById(serviceId);

    if (!serviceToUpdate) {
      return left(new ResourceNotFoundError());
    }

    if (!serviceToUpdate.establishmentId.equals(establishment.id)) {
      return left(new NotAllowed());
    }

    try {
      serviceToUpdate.update(data);
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

    await this.servicesRepository.save(serviceToUpdate);

    return right({
      service: serviceToUpdate,
    });
  }
}
