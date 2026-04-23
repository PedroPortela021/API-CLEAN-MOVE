import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import z from "zod";
import { ResetPasswordWithCodeUseCase } from "../../../modules/application/use-cases/auth/reset-password-with-code";
import { Public } from "../../auth/public";
import { ResetPasswordBodyDto } from "../docs/auth-swagger.dto";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";

const resetPasswordBodySchema = z.object({
  token: z.string().trim().min(1),
  newPassword: z.string().min(6).max(72),
});

type ResetPasswordBodySchema = z.infer<typeof resetPasswordBodySchema>;

@ApiTags("auth")
@Controller("/auth")
@Public()
export class ResetPasswordController {
  constructor(private readonly resetPassword: ResetPasswordWithCodeUseCase) {}

  @Post("reset-password")
  @HttpCode(204)
  @UsePipes(new ZodValidationPipe(resetPasswordBodySchema))
  @ApiOperation({
    summary: "Reset password using a single-use token from email link.",
  })
  @ApiBody({ type: ResetPasswordBodyDto })
  @ApiNoContentResponse({
    description: "Password changed successfully.",
  })
  @ApiBadRequestResponse({
    description: "Invalid or expired reset token, or invalid payload.",
  })
  async handle(@Body() body: ResetPasswordBodySchema) {
    const result = await this.resetPassword.execute({
      token: body.token,
      newPassword: body.newPassword,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    return;
  }
}
