import { UserRole } from "../../modules/accounts/domain/value-objects/user-role";

export type HeaderValue = string | string[] | undefined;

export type AuthenticatedUser = {
  userId: string;
  sessionId: string;
  role: UserRole;
};

export type AuthenticatedRequest = {
  headers: Record<string, HeaderValue>;
  user?: AuthenticatedUser;
};
