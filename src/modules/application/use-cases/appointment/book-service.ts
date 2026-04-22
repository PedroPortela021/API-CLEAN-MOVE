import { Injectable } from "@nestjs/common";
import { left } from "../../../../shared/either";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { UnexpectedDomainError } from "../../../../shared/errors/unexpected-domain-error";
import { EstablishmentsRepository } from "../../repositories/establishment-repository";
import {
  AppointmentBookingService,
  AppointmentBookingServiceRequest,
  AppointmentBookingServiceResponse,
} from "../../services/appointment-booking-service";

type BookServiceByEstablishmentOwnerRequest = {
  establishmentOwnerId: string;
  customerId: string;
  serviceId: string;
  startsAt: Date;
  reservationExpiresAt?: Date | null;
};

type BookServiceUseCaseRequest =
  | AppointmentBookingServiceRequest
  | BookServiceByEstablishmentOwnerRequest;

type BookServiceUseCaseResponse = AppointmentBookingServiceResponse;

@Injectable()
export class BookServiceUseCase {
  constructor(
    private appointmentBookingService: AppointmentBookingService,
    private establishmentsRepository?: EstablishmentsRepository,
  ) {}

  async execute(
    params: BookServiceUseCaseRequest,
  ): Promise<BookServiceUseCaseResponse> {
    if ("establishmentOwnerId" in params) {
      if (!this.establishmentsRepository) {
        return left(new UnexpectedDomainError());
      }

      const establishment = await this.establishmentsRepository.findByOwnerId(
        params.establishmentOwnerId,
      );

      if (!establishment) {
        return left(new ResourceNotFoundError({ resource: "establishment" }));
      }

      return this.appointmentBookingService.execute({
        customerId: params.customerId,
        serviceId: params.serviceId,
        startsAt: params.startsAt,
        reservationExpiresAt: params.reservationExpiresAt ?? null,
        establishmentId: establishment.id.toString(),
        author: {
          authorId: establishment.id.toString(),
          authorType: "ESTABLISHMENT",
        },
      });
    }

    return this.appointmentBookingService.execute(params);
  }
}
