import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UsePipes,
} from "@nestjs/common";
import z from "zod";
import { Public } from "../../auth/public";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";
import { UnexpectedDomainError } from "../../../shared/errors/unexpected-domain-error";
import { LoginWithCredentialsUseCase } from "../../../modules/application/use-cases/auth/login-with-credentials";
import { InvalidCredentialsError } from "../../../shared/errors/invalid-credentials-error";
import { EnvService } from "../../env/env.service";

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket: {
    remoteAddress?: string | null;
  };
};

type ResponseCookieOptions = {
  httpOnly: boolean;
  path: string;
  maxAge: number;
  secure: boolean;
  sameSite: "lax" | "none";
};

type ResponseLike = {
  cookie(
    name: string,
    value: string,
    options: ResponseCookieOptions,
  ): void;
};

const loginWithCredentialsBodySchema = z.object({
  email: z.email().trim(),
  password: z.string().nonempty().max(72),
});

type LoginWithCredentialsBodySchema = z.infer<
  typeof loginWithCredentialsBodySchema
>;

@Controller("/auth")
@Public()
export class LoginWithCredentialsController {
  constructor(
    private readonly loginWithCredentials: LoginWithCredentialsUseCase,
    private readonly envService: EnvService,
  ) {}

  private getUserAgent(req: RequestLike): string | null {
    const userAgent = req.headers["user-agent"];

    if (typeof userAgent !== "string") {
      return null;
    }

    return userAgent.trim() || null;
  }

  private getIpAddress(req: RequestLike): string | null {
    const forwardedForHeader = req.headers["x-forwarded-for"];
    const forwardedFor = Array.isArray(forwardedForHeader)
      ? forwardedForHeader[0]
      : forwardedForHeader;

    if (typeof forwardedFor === "string") {
      const firstForwardedIp = forwardedFor.split(",")[0]?.trim();

      if (firstForwardedIp) {
        return firstForwardedIp;
      }
    }

    if (req.ip?.trim()) {
      return req.ip.trim();
    }

    return req.socket.remoteAddress?.trim() || null;
  }

  @Post("login")
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(loginWithCredentialsBodySchema))
  async handle(
    @Body() body: LoginWithCredentialsBodySchema,
    @Req() req: RequestLike,
    @Res({ passthrough: true }) res: ResponseLike,
  ) {
    const result = await this.loginWithCredentials.execute({
      ...body,
      userAgent: this.getUserAgent(req),
      ipAddress: this.getIpAddress(req),
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case InvalidCredentialsError:
          throw new BadRequestException(error.message);
        case UnexpectedDomainError:
          throw new InternalServerErrorException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    const isProduction = this.envService.get("NODE_ENV") === "production";

    res.cookie("refresh_token", result.value.refreshToken, {
      httpOnly: true,
      path: "/auth",
      maxAge: this.envService.get("REFRESH_TOKEN_TTL_IN_MS"),
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return {
      userId: result.value.user.id.toString(),
      accessToken: result.value.accessToken,
    };
  }
}
