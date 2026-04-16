import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  UnauthorizedException,
  UsePipes,
} from "@nestjs/common";
import z from "zod";
import { Email, InvalidEmailError } from "../../../modules/accounts/domain/value-objects/email";
import { AuthenticateWithOAuthUseCase } from "../../../modules/application/use-cases/auth/authenticate-with-oauth";
import { OAuthEmailNotVerifiedError } from "../../../shared/errors/oauth-email-not-verified-error";
import { Public } from "../../auth/public";
import { AuthTokenService } from "../../../modules/application/services/auth-token-service";
import { OAuthIdTokenVerifier } from "../../../modules/application/services/oauth-id-token-verifier";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";

const authenticateWithGoogleBodySchema = z.object({
  idToken: z.string().trim().min(1),
});

type AuthenticateWithGoogleBodySchema = z.infer<
  typeof authenticateWithGoogleBodySchema
>;

@Controller("/auth/oauth/google")
@Public()
export class AuthenticateWithGoogleController {
  constructor(
    private authenticateWithOAuth: AuthenticateWithOAuthUseCase,
    private oauthIdTokenVerifier: OAuthIdTokenVerifier,
    private authTokenService: AuthTokenService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(authenticateWithGoogleBodySchema))
  async handle(@Body() body: AuthenticateWithGoogleBodySchema) {
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
    const { accessToken, refreshToken } =
      await this.authTokenService.issueForUser(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id.toString(),
        role: user.role,
        profileComplete: user.isProfileComplete(),
      },
    };
  }
}
