import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UsePipes,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import z from "zod";
import { randomBytes } from "node:crypto";
import {
  Email,
  InvalidEmailError,
} from "../../../modules/accounts/domain/value-objects/email";
import { AuthenticateWithOAuthUseCase } from "../../../modules/application/use-cases/auth/authenticate-with-oauth";
import { OAuthEmailNotVerifiedError } from "../../../shared/errors/oauth-email-not-verified-error";
import { Public } from "../../auth/public";
import { OAuthIdTokenVerifier } from "../../../modules/application/services/oauth-id-token-verifier";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";
import { HashGenerator } from "../../../modules/application/repositories/hash-generator";
import { SessionCreationService } from "../../../modules/accounts/domain/services/session-creation-service";
import { SessionsRepository } from "../../../modules/application/repositories/sessions-repository";
import { EnvService } from "../../env/env.service";
import { AuthService } from "../../auth/auth.service";
import { InvalidSessionCreationError } from "../../../modules/accounts/domain/errors/invalid-session-creation-error";

const authenticateWithGoogleBodySchema = z.object({
  idToken: z.string().trim().min(1),
});

type AuthenticateWithGoogleBodySchema = z.infer<
  typeof authenticateWithGoogleBodySchema
>;

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
  cookie(name: string, value: string, options: ResponseCookieOptions): void;
};

@ApiTags("auth")
@Controller("/auth/google")
@Public()
export class AuthenticateWithGoogleController {
  constructor(
    private readonly authenticateWithOAuth: AuthenticateWithOAuthUseCase,
    private readonly oauthIdTokenVerifier: OAuthIdTokenVerifier,
    private readonly hashGenerator: HashGenerator,
    private readonly sessionCreationService: SessionCreationService,
    private readonly sessionsRepository: SessionsRepository,
    private readonly envService: EnvService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(authenticateWithGoogleBodySchema))
  async handle(
    @Body() body: AuthenticateWithGoogleBodySchema,
    @Req() req: RequestLike,
    @Res({ passthrough: true }) res: ResponseLike,
  ) {
    const { idToken } = body;

    let claims;

    try {
      claims = await this.oauthIdTokenVerifier.verifyGoogleIdToken(idToken);
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : "Invalid OAuth token.",
      );
    }

    let email: Email;

    try {
      email = new Email(claims.email);
    } catch (error) {
      if (error instanceof InvalidEmailError) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException("Failed to parse OAuth email.");
    }

    const result = await this.authenticateWithOAuth.execute({
      provider: claims.provider,
      subjectId: claims.subjectId,
      email,
      emailVerified: claims.emailVerified,
      ...(claims.name ? { name: claims.name } : {}),
    });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof OAuthEmailNotVerifiedError) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException("OAuth authentication failed.");
    }

    const { user } = result.value;
    const refreshToken = randomBytes(32).toString("base64url");
    const refreshTokenTtlInMs = this.envService.get("REFRESH_TOKEN_TTL_IN_MS");

    const userAgentHeader = req.headers["user-agent"];
    const userAgent =
      typeof userAgentHeader === "string"
        ? userAgentHeader.trim() || null
        : null;

    const forwardedForHeader = req.headers["x-forwarded-for"];
    const forwardedFor = Array.isArray(forwardedForHeader)
      ? forwardedForHeader[0]
      : forwardedForHeader;
    const ipAddress =
      (typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0]?.trim()
        : null) ||
      req.ip?.trim() ||
      req.socket.remoteAddress?.trim() ||
      null;

    let accessToken: string;
    try {
      const refreshTokenHash = await this.hashGenerator.hash(refreshToken);
      const session = this.sessionCreationService.execute({
        userId: user.id,
        refreshTokenHash,
        ttlInMs: refreshTokenTtlInMs,
        referenceDate: new Date(),
        ipAddress,
        userAgent,
      });

      accessToken = await this.authService.generateAccessToken({
        sub: user.id.toString(),
        role: user.role,
        sid: session.id.toString(),
      });

      await this.sessionsRepository.create(session);
    } catch (error) {
      if (error instanceof InvalidSessionCreationError) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException("Google authentication failed.");
    }

    const isProduction = this.envService.get("NODE_ENV") === "production";
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      path: "/auth",
      maxAge: refreshTokenTtlInMs,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return {
      accessToken,
      userId: user.id.toString(),
    };
  }
}
