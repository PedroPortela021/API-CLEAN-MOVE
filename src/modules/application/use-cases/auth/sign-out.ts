import { Injectable } from "@nestjs/common";
import { Either, left, right } from "../../../../shared/either";
import { SessionsRepository } from "../../repositories/sessions-repository";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";

type SignOutUseCaseRequest = {
  userId: string;
  sessionId: string;
};

type SignOutUseCaseResponse = Either<ResourceNotFoundError, { ok: true }>;

@Injectable()
export class SignOutUseCase {
  constructor(private sessionsRepository: SessionsRepository) {}

  async execute({
    userId,
    sessionId,
  }: SignOutUseCaseRequest): Promise<SignOutUseCaseResponse> {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      return left(new ResourceNotFoundError({ resource: "session" }));
    }

    if (session.userId.toString() !== userId) {
      return left(
        new ResourceNotFoundError({ resource: "session by this user" }),
      );
    }

    session.revoke();

    await this.sessionsRepository.save(session);

    return right({ ok: true });
  }
}
