import { Either, left, right } from "../../../../shared/either";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { AppointmentsRepository } from "../../repositories/appointments-repository";
import { EstablishmentsRepository } from "../../repositories/establishment-repository";
import { ServicesRepository } from "../../repositories/services-repository";
import {
  EstablishmentMetricsFilters,
  filterAppointmentsByMetrics,
  findAllAppointmentsByEstablishment,
  findAllServicesByEstablishment,
} from "./establishment-metrics-helpers";

type GetEstablishmentCancellationRateUseCaseRequest = {
  establishmentId: string;
  filters?: EstablishmentMetricsFilters;
};

type GetEstablishmentCancellationRateUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    cancellationRate: number;
  }
>;

export class GetEstablishmentCancellationRateUseCase {
  constructor(
    private establishmentsRepository: EstablishmentsRepository,
    private appointmentsRepository: AppointmentsRepository,
    private servicesRepository: ServicesRepository,
  ) {}

  async execute({
    establishmentId,
    filters,
  }: GetEstablishmentCancellationRateUseCaseRequest): Promise<GetEstablishmentCancellationRateUseCaseResponse> {
    const establishment =
      await this.establishmentsRepository.findById(establishmentId);

    if (!establishment) {
      return left(new ResourceNotFoundError({ resource: "establishment" }));
    }

    const services = await findAllServicesByEstablishment(
      this.servicesRepository,
      establishmentId,
    );

    const servicesById = new Map(
      services.map((service) => [service.id.toString(), service.category]),
    );

    const appointments = await findAllAppointmentsByEstablishment(
      this.appointmentsRepository,
      establishmentId,
    );

    const filteredAppointments = filterAppointmentsByMetrics(
      appointments,
      servicesById,
      filters,
    );

    if (filteredAppointments.length === 0) {
      return right({ cancellationRate: 0 });
    }

    const cancelledCount = filteredAppointments.filter(
      (appointment) => appointment.status === "CANCELLED",
    ).length;

    return right({
      cancellationRate: Number(
        (cancelledCount / filteredAppointments.length).toFixed(4),
      ),
    });
  }
}
