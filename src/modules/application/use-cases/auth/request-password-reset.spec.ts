import { Email } from "../../../accounts/domain/value-objects/email";
import { ResourceNotFoundError } from "../../../../shared/errors/resource-not-found-error";
import { makeUser } from "../../../../../tests/factories/user-factory";
import { FakeHashGenerator } from "../../../../../tests/repositories/fake-hash-generator";
import { FakeMailSender } from "../../../../../tests/repositories/fake-mail-sender";
import { FakeResetCodeGenerator } from "../../../../../tests/repositories/fake-reset-code-generator";
import { InMemoryPasswordResetTokensRepository } from "../../../../../tests/repositories/in-memory-password-reset-tokens-repository";
import { InMemoryUsersRepository } from "../../../../../tests/repositories/in-memory-users-repository";
import { RequestPasswordResetUseCase } from "./request-password-reset";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryTokensRepository: InMemoryPasswordResetTokensRepository;
let fakeHashGenerator: FakeHashGenerator;
let fakeMailSender: FakeMailSender;
let fakeResetCodeGenerator: FakeResetCodeGenerator;

let sut: RequestPasswordResetUseCase;

describe("Request password reset", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryTokensRepository = new InMemoryPasswordResetTokensRepository();
    fakeHashGenerator = new FakeHashGenerator();
    fakeMailSender = new FakeMailSender();
    fakeResetCodeGenerator = new FakeResetCodeGenerator();

    sut = new RequestPasswordResetUseCase(
      inMemoryUsersRepository,
      inMemoryTokensRepository,
      fakeHashGenerator,
      fakeMailSender,
      fakeResetCodeGenerator,
    );
  });

  it("should fail when user email is not registered", async () => {
    const result = await sut.execute({
      email: new Email("missing@example.com"),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error("expected left");
    }
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(inMemoryTokensRepository.items).toHaveLength(0);
    expect(fakeMailSender.sent).toHaveLength(0);
  });

  it("should store hashed token and send plain token by email", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("john@example.com"),
    });
    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      email: new Email("john@example.com"),
    });

    expect(result.isRight()).toBe(true);
    expect(fakeMailSender.sent).toEqual([
      { to: "john@example.com", token: "123456" },
    ]);
    expect(inMemoryTokensRepository.items).toHaveLength(1);
    const token = inMemoryTokensRepository.items[0];
    expect(token?.hashedCode).toBe("123456-hashed");
    expect(token?.userId.equals(user.id)).toBe(true);
  });

  it("should replace previous token when requesting again", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("john@example.com"),
    });
    await inMemoryUsersRepository.create(user);

    await sut.execute({ email: new Email("john@example.com") });
    const firstId = inMemoryTokensRepository.items[0]?.id.toString();

    await sut.execute({ email: new Email("john@example.com") });

    expect(inMemoryTokensRepository.items).toHaveLength(1);
    expect(inMemoryTokensRepository.items[0]?.id.toString()).not.toBe(firstId);
  });
});
