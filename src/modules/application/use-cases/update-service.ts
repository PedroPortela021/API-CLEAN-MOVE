import { Either, left, right } from "../../../shared/either";
import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { NotAllowed } from "../../../shared/errors/not-allowed";
import { Service } from "../../catalog/domain/entities/services";
import { ServiceCategory } from "../../catalog/domain/value-objects/service-category";
import { EstablishmentsRepository } from "../repositories/establishment-repository";
import { ServicesRepository } from "../repositories/services-repository";
import { NoUpdateFieldsProvidedError } from "../../../shared/errors/no-update-field-provided-error";

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
  NoUpdateFieldsProvidedError | ResourceNotFoundError | NotAllowed,
  {
    service: Service;
  }
>;

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
      return left(new ResourceNotFoundError("establishment"));
    }

    const serviceToUpdate = await this.servicesRepository.findById(serviceId);

    if (!serviceToUpdate) {
      return left(new ResourceNotFoundError("service"));
    }

    if (!serviceToUpdate.establishmentId.equals(establishment.id)) {
      return left(new NotAllowed());
    }

    serviceToUpdate.update(data);

    await this.servicesRepository.save(serviceToUpdate);

    return right({
      service: serviceToUpdate,
    });
  }
}
