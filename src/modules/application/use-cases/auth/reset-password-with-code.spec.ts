import { PasswordResetToken } from "../../../accounts/domain/entities/password-reset-token";
import { Email } from "../../../accounts/domain/value-objects/email";
import { InvalidOrExpiredPasswordResetCodeError } from "../../../../shared/errors/invalid-or-expired-password-reset-code-error";
import { makeUser } from "../../../../../tests/factories/user-factory";
import { FakeHashComparer } from "../../../../../tests/repositories/fake-hash-comparer";
import { FakeHashGenerator } from "../../../../../tests/repositories/fake-hash-generator";
import { InMemoryPasswordResetTokensRepository } from "../../../../../tests/repositories/in-memory-password-reset-tokens-repository";
import { InMemoryUsersRepository } from "../../../../../tests/repositories/in-memory-users-repository";
import { ResetPasswordWithCodeUseCase } from "./reset-password-with-code";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryTokensRepository: InMemoryPasswordResetTokensRepository;
let fakeHashComparer: FakeHashComparer;
let fakeHashGenerator: FakeHashGenerator;

let sut: ResetPasswordWithCodeUseCase;

describe("Reset password with code", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryTokensRepository = new InMemoryPasswordResetTokensRepository();
    fakeHashComparer = new FakeHashComparer();
    fakeHashGenerator = new FakeHashGenerator();

    sut = new ResetPasswordWithCodeUseCase(
      inMemoryUsersRepository,
      inMemoryTokensRepository,
      fakeHashComparer,
      fakeHashGenerator,
    );
  });

  it("should reject when email is unknown", async () => {
    const result = await sut.execute({
      email: new Email("nobody@example.com"),
      code: "123456",
      newPassword: "new-secret",
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) {
      throw new Error("expected left");
    }
    expect(result.value).toBeInstanceOf(InvalidOrExpiredPasswordResetCodeError);
  });

  it("should reject when there is no reset token", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("john@example.com"),
    });
    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      email: new Email("john@example.com"),
      code: "123456",
      newPassword: "new-secret",
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should reject when token is expired", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("john@example.com"),
    });
    await inMemoryUsersRepository.create(user);

    const hashedCode = await fakeHashGenerator.hash("123456");
    const token = PasswordResetToken.create({
      userId: user.id,
      hashedCode,
      expiresAt: new Date("2020-01-01T00:00:00.000Z"),
    });
    await inMemoryTokensRepository.upsert(token);

    const result = await sut.execute({
      email: new Email("john@example.com"),
      code: "123456",
      newPassword: "new-secret",
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should reject when code is wrong", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("john@example.com"),
    });
    await inMemoryUsersRepository.create(user);

    const hashedCode = await fakeHashGenerator.hash("123456");
    const token = PasswordResetToken.create({
      userId: user.id,
      hashedCode,
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    });
    await inMemoryTokensRepository.upsert(token);

    const result = await sut.execute({
      email: new Email("john@example.com"),
      code: "999999",
      newPassword: "new-secret",
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should update password and remove token on success", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("john@example.com"),
      hashedPassword: "old-hashed",
    });
    await inMemoryUsersRepository.create(user);

    const hashedCode = await fakeHashGenerator.hash("123456");
    const token = PasswordResetToken.create({
      userId: user.id,
      hashedCode,
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    });
    await inMemoryTokensRepository.upsert(token);

    const result = await sut.execute({
      email: new Email("john@example.com"),
      code: "123456",
      newPassword: "new-secret",
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) {
      throw result.value;
    }
    expect(result.value.user.hashedPassword).toBe("new-secret-hashed");
    expect(inMemoryTokensRepository.items).toHaveLength(0);
  });

  it("should allow OAuth-only user to set a local password", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("oauth@example.com"),
      hashedPassword: null,
      phone: null,
      address: null,
    });
    await inMemoryUsersRepository.create(user);

    const hashedCode = await fakeHashGenerator.hash("123456");
    const token = PasswordResetToken.create({
      userId: user.id,
      hashedCode,
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    });
    await inMemoryTokensRepository.upsert(token);

    const result = await sut.execute({
      email: new Email("oauth@example.com"),
      code: "123456",
      newPassword: "first-local",
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) {
      throw result.value;
    }
    expect(result.value.user.hashedPassword).toBe("first-local-hashed");
  });
});
