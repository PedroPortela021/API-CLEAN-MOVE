import { JwtService } from "@nestjs/jwt";
import { AuthService } from "../../../../infra/auth/auth.service";
import type { Env } from "../../../../infra/env/env";
import type { EnvService } from "../../../../infra/env/env.service";
import { Email } from "../../../accounts/domain/value-objects/email";
import { SessionCreationService } from "../../../accounts/domain/services/session-creation-service";
import { InvalidCredentialsError } from "../../../../shared/errors/invalid-credentials-error";
import { makeUser } from "../../../../../tests/factories/user-factory";
import { FakeHashComparer } from "../../../../../tests/repositories/fake-hash-comparer";
import { FakeHashGenerator } from "../../../../../tests/repositories/fake-hash-generator";
import { InMemorySessionsRepository } from "../../../../../tests/repositories/in-memory-sessions-repository";
import { InMemoryUsersRepository } from "../../../../../tests/repositories/in-memory-users-repository";
import { LoginWithCredentialsUseCase } from "./login-with-credentials";

const refreshTokenTtlInMs = 1_296_000_000;
type EnvReader = {
  get<T extends keyof Env>(key: T): Env[T];
};

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemorySessionsRepository: InMemorySessionsRepository;
let fakeHashComparer: FakeHashComparer;
let fakeHashGenerator: FakeHashGenerator;
let sessionCreationService: SessionCreationService;
let envService: EnvReader;
let authService: AuthService;

let sut: LoginWithCredentialsUseCase;

describe("Login with credentials", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemorySessionsRepository = new InMemorySessionsRepository();
    fakeHashComparer = new FakeHashComparer();
    fakeHashGenerator = new FakeHashGenerator();
    sessionCreationService = new SessionCreationService();
    envService = {
      get<T extends keyof Env>(key: T): Env[T] {
        if (key === "REFRESH_TOKEN_TTL_IN_MS") {
          return refreshTokenTtlInMs as Env[T];
        }

        throw new Error(`Unexpected env key requested: ${String(key)}`);
      },
    };
    authService = new AuthService(
      new JwtService({ secret: "test-access-secret" }),
    );

    sut = new LoginWithCredentialsUseCase(
      inMemoryUsersRepository,
      inMemorySessionsRepository,
      fakeHashComparer,
      fakeHashGenerator,
      sessionCreationService,
      envService as EnvService,
      authService,
    );
  });

  it("should authenticate with valid email and password", async () => {
    const plainPassword = "secret123";
    const hashedPassword = await fakeHashGenerator.hash(plainPassword);

    const user = makeUser("CUSTOMER", {
      email: new Email("john@example.com"),
      hashedPassword,
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      email: "john@example.com",
      password: plainPassword,
      userAgent: "  Mozilla/5.0  ",
      ipAddress: "  127.0.0.1  ",
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.user).toBe(user);
    expect(result.value.refreshToken).toEqual(expect.any(String));
    expect(result.value.accessToken).toEqual(expect.any(String));
    expect(inMemorySessionsRepository.items).toHaveLength(1);

    const createdSession = inMemorySessionsRepository.items[0];

    expect(createdSession).toBeDefined();

    if (!createdSession) {
      throw new Error("Expected created session.");
    }

    expect(result.value.session).toBe(createdSession);
    expect(createdSession.userId.equals(user.id)).toBe(true);
    expect(createdSession.refreshTokenHash).toBe(
      `${result.value.refreshToken}-hashed`,
    );
    expect(createdSession.userAgent).toBe("Mozilla/5.0");
    expect(createdSession.ipAddress).toBe("127.0.0.1");
    expect(
      createdSession.expiresAt.getTime() - createdSession.createdAt.getTime(),
    ).toBe(refreshTokenTtlInMs);
  });

  it("should generate an access token bound to the created session", async () => {
    const plainPassword = "secret123";
    const hashedPassword = await fakeHashGenerator.hash(plainPassword);

    const user = makeUser("ESTABLISHMENT", {
      email: new Email("john@example.com"),
      hashedPassword,
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      email: "john@example.com",
      password: plainPassword,
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    const payload = await new JwtService({
      secret: "test-access-secret",
    }).verifyAsync<{
      sub: string;
      role: string;
      sid: string;
    }>(result.value.accessToken);

    expect(payload.sub).toBe(user.id.toString());
    expect(payload.role).toBe("ESTABLISHMENT");
    expect(payload.sid).toBe(result.value.session.id.toString());
  });

  it("should reject when email is unknown", async () => {
    const result = await sut.execute({
      email: "nobody@example.com",
      password: "any",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidCredentialsError);
    expect(inMemorySessionsRepository.items).toHaveLength(0);
  });

  it("should reject when password is wrong", async () => {
    const user = makeUser("CUSTOMER", {
      email: new Email("john@example.com"),
      hashedPassword: "secret123-hashed",
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      email: "john@example.com",
      password: "wrong-password",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidCredentialsError);
    expect(inMemorySessionsRepository.items).toHaveLength(0);
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
      email: "oauth@example.com",
      password: "any",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidCredentialsError);
    expect(inMemorySessionsRepository.items).toHaveLength(0);
  });

  it("should reject when email format is invalid", async () => {
    const result = await sut.execute({
      email: "invalid-email",
      password: "any",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidCredentialsError);
    expect(inMemorySessionsRepository.items).toHaveLength(0);
  });

  it("should create a session with null metadata when request does not provide it", async () => {
    const plainPassword = "secret123";
    const hashedPassword = await fakeHashGenerator.hash(plainPassword);

    const user = makeUser("CUSTOMER", {
      email: new Email("john@example.com"),
      hashedPassword,
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      email: "john@example.com",
      password: plainPassword,
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(result.value.session.userAgent).toBeNull();
    expect(result.value.session.ipAddress).toBeNull();
  });
});
