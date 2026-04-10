import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  InternalServerErrorException,
  Post,
  UsePipes,
} from "@nestjs/common";
import z from "zod";
import { Public } from "../../auth/public";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";
import { RegisterEstablishmentUseCase } from "../../../modules/application/use-cases/establishment/register-establishment";
import { InvalidRegisterEstablishmentInputError } from "../../../modules/establishments/domain/errors/invalid-register-establishment-input-error";
import { ResourceAlreadyExistsError } from "../../../shared/errors/resource-already-exists-error";
import { UnexpectedDomainError } from "../../../shared/errors/unexpected-domain-error";

const timeRangeSchema = z.object({
  start: z.string().trim().min(1),
  end: z.string().trim().min(1),
});

const openingDaySchema = z.object({
  day: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  ranges: z.array(timeRangeSchema),
});

export const operatingHoursSchema = z.object({
  days: z.array(openingDaySchema),
});

const registerEstablishmentBodySchema = z.object({
  name: z.string().trim().min(1),
  corporateName: z.string().trim().min(1),
  socialReason: z.string().trim().min(1),
  email: z.email(),
  password: z.string().nonempty().max(72),
  cnpj: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  address: z.object({
    street: z.string().trim().min(1),
    country: z.string().trim().min(1),
    state: z.string().trim().min(1),
    zipCode: z.string().trim().min(1),
    city: z.string().trim().min(1),
  }),
  operatingHours: operatingHoursSchema,
  slug: z.string().trim().min(1).optional(),
});

type RegisterEstablishmentBodySchema = z.infer<
  typeof registerEstablishmentBodySchema
>;

@Controller("/register/establishment")
@Public()
export class RegisterEstablishmentController {
  constructor(private registerEstablishment: RegisterEstablishmentUseCase) {}

  @Post()
  @UsePipes(new ZodValidationPipe(registerEstablishmentBodySchema))
  async handle(@Body() body: RegisterEstablishmentBodySchema) {
    const result = await this.registerEstablishment.execute(body);

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceAlreadyExistsError:
          throw new ConflictException(error.message);
        case InvalidRegisterEstablishmentInputError:
          throw new BadRequestException(error.message);
        case UnexpectedDomainError:
          throw new InternalServerErrorException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return {
      establishmentId: result.value.establishment.id.toString(),
    };
  }
}
