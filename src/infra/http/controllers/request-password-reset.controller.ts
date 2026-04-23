import { Body, Controller, HttpCode, Post, UsePipes } from "@nestjs/common";
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import z from "zod";
import { Email } from "../../../modules/accounts/domain/value-objects/email";
import { RequestPasswordResetUseCase } from "../../../modules/application/use-cases/auth/request-password-reset";
import { Public } from "../../auth/public";
import {
  ForgotPasswordBodyDto,
  GenericAcceptedResponseDto,
} from "../docs/auth-swagger.dto";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";

const requestPasswordResetBodySchema = z.object({
  email: z.email().trim(),
});

type RequestPasswordResetBodySchema = z.infer<
  typeof requestPasswordResetBodySchema
>;

@ApiTags("auth")
@Controller("/auth")
@Public()
export class RequestPasswordResetController {
  constructor(
    private readonly requestPasswordReset: RequestPasswordResetUseCase,
  ) {}

  @Post("forgot-password")
  @HttpCode(202)
  @UsePipes(new ZodValidationPipe(requestPasswordResetBodySchema))
  @ApiOperation({
    summary: "Request a password reset link.",
  })
  @ApiBody({ type: ForgotPasswordBodyDto })
  @ApiAcceptedResponse({
    description:
      "Request processed. If the account exists, an email with reset link is sent.",
    type: GenericAcceptedResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid request payload.",
  })
  async handle(@Body() body: RequestPasswordResetBodySchema) {
    const result = await this.requestPasswordReset.execute({
      email: new Email(body.email),
    });

    if (result.isLeft()) {
      return {
        message:
          "If this email is registered, you will receive a password reset link shortly.",
      };
    }

    return {
      message:
        "If this email is registered, you will receive a password reset link shortly.",
    };
  }
}
