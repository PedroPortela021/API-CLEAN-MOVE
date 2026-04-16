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

import { RegisterCustomerUseCase } from "../../../modules/application/use-cases/customer/register-customer";
import { InvalidRegisterCustomerInputError } from "../../../modules/customer/domain/errors/invalid-register-customer-input-error";
import { ResourceAlreadyExistsError } from "../../../shared/errors/resource-already-exists-error";
import { UnexpectedDomainError } from "../../../shared/errors/unexpected-domain-error";
import { Public } from "../../auth/public";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";

const registerCustomerBodySchema = z.object({
  cpf: z.string().trim().min(1),
  name: z.string().trim().min(1),
  email: z.email().trim(),
  password: z.string().nonempty().max(72),
  phone: z.string().trim().min(1),
  address: z.object({
    street: z.string().trim().min(1),
    country: z.string().trim().min(1),
    state: z.string().trim().min(1),
    zipCode: z.string().trim().min(1),
    city: z.string().trim().min(1),
  }),
});

type RegisterCustomerBodySchema = z.infer<typeof registerCustomerBodySchema>;

@Controller("/register/customer")
@Public()
export class RegisterCustomerController {
  constructor(private registerCustomer: RegisterCustomerUseCase) {}

  @Post()
  @UsePipes(new ZodValidationPipe(registerCustomerBodySchema))
  async handle(@Body() body: RegisterCustomerBodySchema) {
    const result = await this.registerCustomer.execute(body);

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceAlreadyExistsError:
          throw new ConflictException(error.message);
        case InvalidRegisterCustomerInputError:
          throw new BadRequestException(error.message);
        case UnexpectedDomainError:
          throw new InternalServerErrorException(error.message);
        default:
          throw new InternalServerErrorException(error.message);
      }
    }

    return {
      customerId: result.value.customer.id.toString(),
    };
  }
}
