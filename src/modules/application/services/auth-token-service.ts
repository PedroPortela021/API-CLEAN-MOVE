import { Injectable } from "@nestjs/common";
import { User } from "../../accounts/domain/entities/user";

export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export abstract class AuthTokenService {
  abstract issueForUser(user: User): Promise<AuthTokenPair>;
}
