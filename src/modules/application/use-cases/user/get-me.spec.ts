import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { makeUser } from "../../../../../tests/factories/user-factory";
import { InMemoryUsersRepository } from "../../../../../tests/repositories/in-memory-users-repository";
import { GetMeUseCase } from "./get-me";

let inMemoryUsersRepository: InMemoryUsersRepository;

let sut: GetMeUseCase;

describe("Get me", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();

    sut = new GetMeUseCase(inMemoryUsersRepository);
  });

  it("should be able to get the authenticated user", async () => {
    const createdUser = makeUser("CUSTOMER");

    await inMemoryUsersRepository.create(createdUser);

    const result = await sut.execute({
      userId: createdUser.id.toString(),
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.user).toBe(createdUser);
  });

  it("not should be able to get me with unknown user id", async () => {
    const result = await sut.execute({
      userId: "unknown-user-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});
