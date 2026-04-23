import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  NotFoundException,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
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

@ApiTags("appointment")
@Controller("/services")
@Roles(["ESTABLISHMENT"])
export class CreateServiceController {
  constructor(private readonly createService: CreateServiceUseCase) {}

  @Post()
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
