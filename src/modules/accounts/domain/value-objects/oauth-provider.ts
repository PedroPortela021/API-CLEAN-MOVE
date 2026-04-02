export type OAuthProvider = "GOOGLE";

export const OAUTH_PROVIDERS: readonly OAuthProvider[] = ["GOOGLE"];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}
