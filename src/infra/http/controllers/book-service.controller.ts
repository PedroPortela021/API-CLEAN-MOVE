import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  InternalServerErrorException,
  NotFoundException,
  Post,
  UnauthorizedException,
  UsePipes,
} from "@nestjs/common";
import z from "zod";

import { BookServiceUseCase } from "../../../modules/application/use-cases/appointment/book-service";
import { InactiveServiceError } from "../../../modules/catalog/domain/errors/inactive-service-error";
import { EstablishmentClosedError } from "../../../modules/establishments/domain/errors/establishment-closed-error";
import { InvalidBookServiceInputError } from "../../../modules/scheduling/domain/errors/invalid-book-service-input-error";
import { TimeSlotAlreadyBookedError } from "../../../modules/scheduling/domain/errors/time-slot-already-booked-error";
import { AuthenticatedUser } from "../../auth/authenticated-user";
import { CurrentUser } from "../../auth/current-user";
import { Roles } from "../../auth/roles";
import { UnexpectedDomainError } from "../../../shared/errors/unexpected-domain-error";
import { NotAllowedError } from "../../../shared/errors/not-allowed-error";
import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";

const bookServiceBodySchema = z.object({
  customerId: z.uuid(),
  serviceId: z.uuid(),
  startsAt: z.coerce.date(),
  reservationExpiresAt: z.union([z.coerce.date(), z.null()]).optional(),
});

type BookServiceBodySchema = z.infer<typeof bookServiceBodySchema>;

@Controller("/appointment")
@Roles(["ESTABLISHMENT"])
export class BookServiceController {
  constructor(private readonly bookService: BookServiceUseCase) {}

  @Post()
  @UsePipes(new ZodValidationPipe(bookServiceBodySchema))
  async handle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: BookServiceBodySchema,
  ) {
    const result = await this.bookService.execute({
      establishmentOwnerId: user.userId,
      customerId: body.customerId,
      serviceId: body.serviceId,
      startsAt: body.startsAt,
      reservationExpiresAt: body.reservationExpiresAt ?? null,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case NotAllowedError:
          throw new UnauthorizedException(error.message);
        case InactiveServiceError:
          throw new BadRequestException(error.message);
        case EstablishmentClosedError:
          throw new BadRequestException(error.message);
        case TimeSlotAlreadyBookedError:
          throw new ConflictException(error.message);
        case InvalidBookServiceInputError:
          throw new BadRequestException(error.message);
        case UnexpectedDomainError:
          throw new InternalServerErrorException(error.message);

        default:
          throw new BadRequestException(error.message);
      }
    }

    return {
      appointmentId: result.value.appointment.id.toString(),
    };
  }
}
