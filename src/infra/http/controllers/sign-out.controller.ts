import {
  Controller,
  HttpCode,
  Post,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SignOutUseCase } from "../../../modules/application/use-cases/auth/sign-out";
import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { AuthenticatedUser } from "../../auth/authenticated-user";
import { CurrentUser } from "../../auth/current-user";
import {
  CookieResponseLike,
  RefreshTokenCookieService,
} from "../../auth/refresh-token-cookie.service";

@ApiTags("auth")
@Controller("/auth")
export class SignOutController {
  constructor(
    private readonly signOut: SignOutUseCase,
    private readonly refreshTokenCookieService: RefreshTokenCookieService,
  ) {}

  @Post("sign-out")
  @HttpCode(204)
  async handle(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: CookieResponseLike,
  ) {
    const result = await this.signOut.execute({
      userId: user.userId,
      sessionId: user.sessionId,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new UnauthorizedException(error.message);
        default:
          throw new UnauthorizedException(error.message);
      }
    }

    this.refreshTokenCookieService.clear(res);
  }
}
