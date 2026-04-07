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

type GetEstablishmentAverageTicketUseCaseRequest = {
  establishmentId: string;
  filters?: EstablishmentMetricsFilters;
};

type GetEstablishmentAverageTicketUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    averageTicketInCents: number;
  }
>;

export class GetEstablishmentAverageTicketUseCase {
  constructor(
    private establishmentsRepository: EstablishmentsRepository,
    private appointmentsRepository: AppointmentsRepository,
    private servicesRepository: ServicesRepository,
  ) {}

  async execute({
    establishmentId,
    filters,
  }: GetEstablishmentAverageTicketUseCaseRequest): Promise<GetEstablishmentAverageTicketUseCaseResponse> {
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
      return right({
        averageTicketInCents: 0,
      });
    }

    const totalRevenueInCents = filteredAppointments.reduce(
      (acc, appointment) => acc + appointment.service.priceInCents,
      0,
    );

    return right({
      averageTicketInCents: Math.round(
        totalRevenueInCents / filteredAppointments.length,
      ),
    });
  }
}
