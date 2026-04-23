import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  NotFoundException,
  Post,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import z from "zod";

import { AuthenticatedUser } from "../../auth/authenticated-user";
import { CurrentUser } from "../../auth/current-user";
import { Roles } from "../../auth/roles";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";
import { CreateServiceUseCase } from "../../../modules/application/use-cases/service/create-service";
import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { InvalidServiceUpdateInputError } from "../../../modules/application/use-cases/service/update-service";
import { UnexpectedDomainError } from "../../../shared/errors/unexpected-domain-error";
import { ServiceCategory } from "../../../modules/catalog/domain/value-objects/service-category";
import { ServicePresenter } from "../presenters/service-presenter";
import {
  CreateServiceBodyDto,
  CreateServiceResponseDto,
} from "../docs/domain-swagger.dto";

const serviceCategories = [
  "WASH",
  "SANITIZATION",
  "AUTOMATIVE_DETAILING",
  "PROTECTION",
  "UPHOLSTERY",
] as const satisfies readonly ServiceCategory[];

const createServiceBodySchema = z.object({
  serviceName: z.string().trim().min(1),
  description: z.string().trim().optional(),
  category: z.enum(serviceCategories).optional(),
  estimatedDuration: z
    .object({
      minInMinutes: z.coerce.number().int().positive(),
      maxInMinutes: z.coerce.number().int().positive().optional(),
    })
    .optional(),
  price: z.number().positive(),
  isActive: z.boolean().optional().default(true),
});

type CreateServiceBodySchema = z.infer<typeof createServiceBodySchema>;

@ApiTags("service")
@Controller("/services")
@Roles(["ESTABLISHMENT"])
export class CreateServiceController {
  constructor(private readonly createService: CreateServiceUseCase) {}

  @Post()
  @ApiOperation({
    summary: "Create a service for the authenticated establishment.",
  })
  @ApiBearerAuth("access-token")
  @ApiBody({ type: CreateServiceBodyDto })
  @ApiCreatedResponse({
    description: "Service created successfully.",
    type: CreateServiceResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      "Invalid payload or invalid service data such as name, price, or estimated duration.",
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid access token.",
  })
  @ApiForbiddenResponse({
    description:
      "Authenticated user does not have permission to create services.",
  })
  @ApiNotFoundResponse({
    description:
      "The authenticated establishment user does not have an establishment profile.",
  })
  @ApiInternalServerErrorResponse({
    description: "Unexpected failure while creating the service.",
  })
  async handle(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createServiceBodySchema))
    body: CreateServiceBodySchema,
  ) {
    const {
      serviceName,
      description,
      category,
      estimatedDuration,
      price,
      isActive,
    } = body;

    const result = await this.createService.execute({
      establishmentOwnerId: user.userId,
      serviceName,
      description,
      category,
      estimatedDuration,
      price,
      isActive,
    });

    if (result.isLeft()) {
      const error = result.value;
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case InvalidServiceUpdateInputError:
          throw new BadRequestException(error.message);
        case UnexpectedDomainError:
          throw new InternalServerErrorException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }
    return {
      service: ServicePresenter.toHTTP(result.value.service),
    };
  }
}
