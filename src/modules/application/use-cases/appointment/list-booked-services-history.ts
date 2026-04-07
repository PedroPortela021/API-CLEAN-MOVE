import { Either, right, left } from "../../../../shared/either";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { Appointment } from "../../../scheduling/domain/entities/appointment";
import { AppointmentAuthor } from "../../../scheduling/domain/policies/appointment-authorization";
import {
  AppointmentFilters,
  AppointmentsRepository,
} from "../../repositories/appointments-repository";
import { CustomersRepository } from "../../repositories/customers-repository";
import { EstablishmentsRepository } from "../../repositories/establishment-repository";

type ListBookedServicesHistoryUseCaseRequest = {
  author: AppointmentAuthor;
  filters?: AppointmentFilters;
};

type ListBookedServicesHistoryUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    appointments: Appointment[];
  }
>;

export class ListBookedServicesHistoryUseCase {
  constructor(
    private appointmentsRepository: AppointmentsRepository,
    private customersRepository: CustomersRepository,
    private establishmentsRepository: EstablishmentsRepository,
  ) {}

  async execute({
    author,
    filters,
  }: ListBookedServicesHistoryUseCaseRequest): Promise<ListBookedServicesHistoryUseCaseResponse> {
    let appointments: Appointment[];

    if (author.authorType === "CUSTOMER") {
      const customer = await this.customersRepository.findById(author.authorId);

      if (!customer) {
        return left(new ResourceNotFoundError({ resource: "customer" }));
      }

      appointments = await this.appointmentsRepository.findManyByCustomerId(
        author.authorId,
        filters,
      );
    } else {
      const establishment = await this.establishmentsRepository.findById(
        author.authorId,
      );

      if (!establishment) {
        return left(new ResourceNotFoundError({ resource: "establishment" }));
      }

      const establishmentFilters = { ...(filters ?? {}) };
      delete establishmentFilters.establishmentName;

      appointments =
        await this.appointmentsRepository.findManyByEstablishmentId(
          author.authorId,
          establishmentFilters,
        );
    }

    return right({
      appointments,
    });
  }
}
