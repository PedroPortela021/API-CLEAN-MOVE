import { Email } from "../../../accounts/domain/value-objects/email";
import { OAuthEmailNotVerifiedError } from "../../../../shared/errors/oauth-email-not-verified-error";
import { makeUser } from "../../../../../tests/factories/user-factory";
import { InMemoryUsersRepository } from "../../../../../tests/repositories/in-memory-users-repository";
import { AuthenticateWithOAuthUseCase } from "./authenticate-with-oauth";

let inMemoryUsersRepository: InMemoryUsersRepository;

let sut: AuthenticateWithOAuthUseCase;

describe("Authenticate with OAuth", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();

    sut = new AuthenticateWithOAuthUseCase(inMemoryUsersRepository);
  });

  it("should reject when email is not verified", async () => {
    const result = await sut.execute({
      provider: "GOOGLE",
      subjectId: "google-sub-1",
      email: new Email("john@example.com"),
      emailVerified: false,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(OAuthEmailNotVerifiedError);
  });

  it("should return user found by provider and subject", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("john@example.com"),
      socialAccounts: [{ provider: "GOOGLE", subjectId: "google-sub-1" }],
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      provider: "GOOGLE",
      subjectId: "google-sub-1",
      email: new Email("other@example.com"),
      emailVerified: true,
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.user).toBe(user);
  });

  it("should link provider when user exists by email", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("john@example.com"),
      socialAccounts: [],
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      provider: "GOOGLE",
      subjectId: "google-sub-new",
      email: new Email("john@example.com"),
      emailVerified: true,
      name: "John Doe",
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.user.socialAccounts).toEqual([
      { provider: "GOOGLE", subjectId: "google-sub-new" },
    ]);
  });

  it("should create incomplete user when no match", async () => {
    const result = await sut.execute({
      provider: "GOOGLE",
      subjectId: "google-brand-new",
      email: new Email("newuser@example.com"),
      emailVerified: true,
      name: "New User",
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    const { user } = result.value;

    expect(user.hashedPassword).toBeNull();
    expect(user.phone).toBeNull();
    expect(user.address).toBeNull();
    expect(user.isProfileComplete()).toBe(false);
    expect(user.socialAccounts).toEqual([
      { provider: "GOOGLE", subjectId: "google-brand-new" },
    ]);
    expect(inMemoryUsersRepository.items).toHaveLength(1);
  });
});
