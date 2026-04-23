import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  InternalServerErrorException,
  NotFoundException,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
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
import { AppointmentPresenter } from "../presenters/appointment-presenter";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";
import {
  BookServiceBodyDto,
  BookServiceResponseDto,
} from "../docs/domain-swagger.dto";

const bookServiceBodySchema = z.object({
  customerId: z.uuid(),
  serviceId: z.uuid(),
  startsAt: z.coerce.date(),
  reservationExpiresAt: z.union([z.coerce.date(), z.null()]).optional(),
});

type BookServiceBodySchema = z.infer<typeof bookServiceBodySchema>;

@ApiTags("appointment")
@Controller("/appointment")
@Roles(["ESTABLISHMENT"])
export class BookServiceController {
  constructor(private readonly bookService: BookServiceUseCase) {}

  @Post()
  @ApiOperation({
    summary: "Create an appointment for a customer and service.",
  })
  @ApiBearerAuth("access-token")
  @ApiBody({ type: BookServiceBodyDto })
  @ApiCreatedResponse({
    description: "Appointment created successfully.",
    type: BookServiceResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      "Invalid payload, inactive service, establishment closed, or invalid appointment rules.",
  })
  @ApiUnauthorizedResponse({
    description:
      "Missing or invalid access token, or not allowed to book for this establishment.",
  })
  @ApiNotFoundResponse({
    description: "Customer or service was not found.",
  })
  @ApiConflictResponse({
    description: "The requested time slot is already booked.",
  })
  @ApiInternalServerErrorResponse({
    description: "Unexpected failure while creating the appointment.",
  })
  async handle(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(bookServiceBodySchema))
    body: BookServiceBodySchema,
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
      appointment: AppointmentPresenter.toHTTP(result.value.appointment),
    };
  }
}
