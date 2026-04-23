import {
  Controller,
  HttpCode,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InvalidSessionError } from "../../../shared/errors/invalid-session-error";
import { UnexpectedDomainError } from "../../../shared/errors/unexpected-domain-error";
import { RefreshSessionUseCase } from "../../../modules/application/use-cases/auth/refresh-session";
import {
  CookieResponseLike,
  RefreshTokenCookieService,
} from "../../auth/refresh-token-cookie.service";
import { Public } from "../../auth/public";

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
};

@ApiTags("auth")
@Controller("/auth")
@Public()
export class RefreshSessionController {
  constructor(
    private readonly refreshSession: RefreshSessionUseCase,
    private readonly refreshTokenCookieService: RefreshTokenCookieService,
  ) {}

  @Post("refresh")
  @HttpCode(200)
  async handle(
    @Req() req: RequestLike,
    @Res({ passthrough: true }) res: CookieResponseLike,
  ) {
    const refreshToken = this.refreshTokenCookieService.get(req);

    if (!refreshToken) {
      throw new UnauthorizedException("Missing refresh token.");
    }

    const result = await this.refreshSession.execute({
      refreshToken,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case InvalidSessionError:
          throw new UnauthorizedException(error.message);
        case UnexpectedDomainError:
          throw new InternalServerErrorException(error.message);
        default:
          throw new UnauthorizedException(error.message);
      }
    }

    this.refreshTokenCookieService.set(res, result.value.refreshToken);

    return {
      userId: result.value.user.id.toString(),
      accessToken: result.value.accessToken,
    };
  }
}
