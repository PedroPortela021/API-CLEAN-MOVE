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

type GetEstablishmentPopularServicesByCategoryUseCaseRequest = {
  establishmentId: string;
  filters?: EstablishmentMetricsFilters;
};

type PopularServiceByCategoryItem = {
  serviceId: string;
  serviceName: string;
  category: string;
  appointmentsCount: number;
  revenueInCents: number;
};

type GetEstablishmentPopularServicesByCategoryUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    popularServices: PopularServiceByCategoryItem[];
  }
>;

export class GetEstablishmentPopularServicesByCategoryUseCase {
  constructor(
    private establishmentsRepository: EstablishmentsRepository,
    private appointmentsRepository: AppointmentsRepository,
    private servicesRepository: ServicesRepository,
  ) {}

  async execute({
    establishmentId,
    filters,
  }: GetEstablishmentPopularServicesByCategoryUseCaseRequest): Promise<GetEstablishmentPopularServicesByCategoryUseCaseResponse> {
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
      services.map((service) => [
        service.id.toString(),
        {
          category: service.category,
          serviceName: service.serviceName.value,
        },
      ]),
    );

    const appointments = await findAllAppointmentsByEstablishment(
      this.appointmentsRepository,
      establishmentId,
    );

    const filteredAppointments = filterAppointmentsByMetrics(
      appointments,
      new Map(
        services.map((service) => [service.id.toString(), service.category]),
      ),
      filters,
    );

    const groupedByService = new Map<string, PopularServiceByCategoryItem>();

    for (const appointment of filteredAppointments) {
      const serviceId = appointment.service.serviceId.toString();
      const serviceMeta = servicesById.get(serviceId);

      if (!serviceMeta) {
        continue;
      }

      const current = groupedByService.get(serviceId);

      if (!current) {
        groupedByService.set(serviceId, {
          serviceId,
          serviceName: appointment.service.serviceName,
          category: serviceMeta.category,
          appointmentsCount: 1,
          revenueInCents: appointment.service.priceInCents,
        });

        continue;
      }

      groupedByService.set(serviceId, {
        ...current,
        appointmentsCount: current.appointmentsCount + 1,
        revenueInCents:
          current.revenueInCents + appointment.service.priceInCents,
      });
    }

    const popularServices = Array.from(groupedByService.values()).sort(
      (a, b) => {
        if (b.appointmentsCount === a.appointmentsCount) {
          return b.revenueInCents - a.revenueInCents;
        }

        return b.appointmentsCount - a.appointmentsCount;
      },
    );

    return right({
      popularServices,
    });
  }
}
