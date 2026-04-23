import { ApiProperty } from "@nestjs/swagger";

export class AuthSuccessResponseDto {
  @ApiProperty({
    example: "9f7f5e87-1f82-4d7d-8c3c-90c4f6073d11",
    description: "Authenticated user identifier.",
  })
  userId!: string;

  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "JWT access token for protected routes.",
  })
  accessToken!: string;
}

export class LoginWithCredentialsBodyDto {
  @ApiProperty({
    example: "user@example.com",
    description: "User email.",
  })
  email!: string;

  @ApiProperty({
    example: "123456",
    description: "User password.",
  })
  password!: string;
}

export class AuthenticateWithGoogleBodyDto {
  @ApiProperty({
    example: "google-id-token",
    description: "Google ID token returned by the frontend OAuth flow.",
  })
  idToken!: string;
}

export class ForgotPasswordBodyDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email used by the account that should be recovered.",
  })
  email!: string;
}

export class ResetPasswordBodyDto {
  @ApiProperty({
    example: "6a8a67b117b5f2ef4dc6413af27f6d4e1b5f26521f53f295f97298f79071025a",
    description: "Single-use password reset token from the email link.",
  })
  token!: string;

  @ApiProperty({
    example: "new-strong-password",
    description: "New account password.",
  })
  newPassword!: string;
}

export class GenericAcceptedResponseDto {
  @ApiProperty({
    example:
      "If this email is registered, you will receive a password reset link shortly.",
  })
  message!: string;
}
