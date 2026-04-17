import { Injectable } from "@nestjs/common";
import { Session } from "../../accounts/domain/entities/session";

@Injectable()
export abstract class SessionsRepository {
  abstract create(session: Session): Promise<void>;
  abstract findById(id: string): Promise<Session | null>;
  abstract findManyByUserId(userId: string): Promise<Session[]>;
  abstract save(session: Session): Promise<void>;
  abstract deleteById(id: string): Promise<void>;
}
