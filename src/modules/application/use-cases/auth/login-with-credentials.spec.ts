import { Email } from "../../../accounts/domain/value-objects/email";
import { InvalidCredentialsError } from "../../../../shared/errors/invalid-credentials-error";
import { makeUser } from "../../../../../tests/factories/user-factory";
import { FakeHashComparer } from "../../../../../tests/repositories/fake-hash-comparer";
import { FakeHashGenerator } from "../../../../../tests/repositories/fake-hash-generator";
import { InMemoryUsersRepository } from "../../../../../tests/repositories/in-memory-users-repository";
import { LoginWithCredentialsUseCase } from "./login-with-credentials";

let inMemoryUsersRepository: InMemoryUsersRepository;
let fakeHashComparer: FakeHashComparer;

let sut: LoginWithCredentialsUseCase;

describe("Login with credentials", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    fakeHashComparer = new FakeHashComparer();

    sut = new LoginWithCredentialsUseCase(
      inMemoryUsersRepository,
      fakeHashComparer,
    );
  });

  it("should authenticate with valid email and password", async () => {
    const plainPassword = "secret123";
    const hashedPassword = await new FakeHashGenerator().hash(plainPassword);

    const user = makeUser("CUSTOMER", {
      email: new Email("john@example.com"),
      hashedPassword,
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      email: new Email("john@example.com"),
      password: plainPassword,
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.user).toBe(user);
  });

  it("should reject when email is unknown", async () => {
    const result = await sut.execute({
      email: new Email("nobody@example.com"),
      password: "any",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidCredentialsError);
  });

  it("should reject when password is wrong", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("john@example.com"),
      hashedPassword: "secret123-hashed",
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      email: new Email("john@example.com"),
      password: "wrong-password",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidCredentialsError);
  });

  it("should reject when user has no local password", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("oauth@example.com"),
      hashedPassword: null,
      phone: null,
      address: null,
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      email: new Email("oauth@example.com"),
      password: "any",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidCredentialsError);
  });
});
