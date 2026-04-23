import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  InternalServerErrorException,
  Post,
  UsePipes,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import z from "zod";

import { RegisterCustomerUseCase } from "../../../modules/application/use-cases/customer/register-customer";
import { InvalidRegisterCustomerInputError } from "../../../modules/customer/domain/errors/invalid-register-customer-input-error";
import { ResourceAlreadyExistsError } from "../../../shared/errors/resource-already-exists-error";
import { UnexpectedDomainError } from "../../../shared/errors/unexpected-domain-error";
import { Public } from "../../auth/public";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";
import {
  RegisterCustomerBodyDto,
  RegisterCustomerResponseDto,
} from "../docs/domain-swagger.dto";

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

@ApiTags("register")
@Controller("/register/customer")
@Public()
export class RegisterCustomerController {
  constructor(private registerCustomer: RegisterCustomerUseCase) {}

  @Post()
  @UsePipes(new ZodValidationPipe(registerCustomerBodySchema))
  @ApiOperation({ summary: "Register a new customer account." })
  @ApiBody({ type: RegisterCustomerBodyDto })
  @ApiCreatedResponse({
    description: "Customer created successfully.",
    type: RegisterCustomerResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid customer registration payload.",
  })
  @ApiConflictResponse({
    description: "A customer with the provided unique data already exists.",
  })
  @ApiInternalServerErrorResponse({
    description: "Unexpected failure while creating the customer.",
  })
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
