import { ResourceAlreadyExistsError } from "../../../shared/errors/resource-already-exists-error";
import { makeEstablishment } from "../../../tests/factories/establishment-factory";
import { makeUser } from "../../../tests/factories/user-factory";
import { FakeHashGenerator } from "../../../tests/repositories/fake-hash-generator";
import { InMemoryEstablishmentsRepository } from "../../../tests/repositories/in-memory-establishment-repository";
import { InMemoryUsersRepository } from "../../../tests/repositories/in-memory-users-repository";
import { Address } from "../../accounts/domain/value-objects/address";
import { Email } from "../../accounts/domain/value-objects/email";
import { Cnpj } from "../../establishments/domain/value-objects/cnpj";
import { OperatingHours } from "../../establishments/domain/value-objects/operating-hours";
import { RegisterEstablishmentUseCase } from "./register-establishment";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryEstablishmentsRepository: InMemoryEstablishmentsRepository;
let fakeHashGenerator: FakeHashGenerator;

let sut: RegisterEstablishmentUseCase;

function makeOperatingHours() {
  return OperatingHours.create({
    days: [
      {
        day: "MONDAY",
        ranges: [{ start: "08:00", end: "18:00" }],
      },
      {
        day: "SATURDAY",
        ranges: [{ start: "08:00", end: "12:00" }],
      },
      {
        day: "SUNDAY",
        ranges: [],
      },
    ],
  });
}

describe("Register an establishment", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryEstablishmentsRepository = new InMemoryEstablishmentsRepository();
    fakeHashGenerator = new FakeHashGenerator();

    sut = new RegisterEstablishmentUseCase(
      inMemoryUsersRepository,
      inMemoryEstablishmentsRepository,
      fakeHashGenerator,
    );
  });

  it("should be able to register an establishment with valid data", async () => {
    const result = await sut.execute({
      name: "Jon Doe",
      address: Address.create({
        city: "city-1",
        country: "country-1",
        state: "state-1",
        street: "street-1",
        zipCode: "11111-111",
      }),
      cnpj: Cnpj.create("37.158.666/0001-82"),
      corporateName: "Valid Establishment",
      socialReason: "SOCIAL REASON TEST LTDA",
      email: new Email("jondoe@example.com"),
      operatingHours: makeOperatingHours(),
      password: "jondoe@123",
      phone: "11111111111",
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    expect(inMemoryEstablishmentsRepository.items[0]).toBe(
      result.value.establishment,
    );
    expect(inMemoryUsersRepository.items[0]?.id).toBe(
      result.value.establishment.ownerId,
    );
    expect(inMemoryUsersRepository.items[0]?.hashedPassword).toBe(
      "jondoe@123-hashed",
    );
    expect(result.value.establishment.slug.value).toEqual("valid-establishment");
  });

  it("not should be able to register an establishment with duplicated email", async () => {
    const createdUser = makeUser("ESTABLISHMENT", {
      email: new Email("jondoe@example.com"),
    });

    await inMemoryUsersRepository.create(createdUser);

    const result = await sut.execute({
      name: "UserWithTheSameEmail",
      address: Address.create({
        city: "city-1",
        country: "country-1",
        state: "state-1",
        street: "street-1",
        zipCode: "11111-111",
      }),
      cnpj: Cnpj.create("03823548000120"),
      corporateName: "Establishment-2",
      socialReason: "SOCIAL REASON TEST LTDA 2",
      email: new Email("jondoe@example.com"),
      operatingHours: makeOperatingHours(),
      password: "jondoe@123",
      phone: "11111111111",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceAlreadyExistsError);

    expect(inMemoryUsersRepository.items).toHaveLength(1);
    expect(inMemoryUsersRepository.items[0]).toBe(createdUser);
    expect(inMemoryEstablishmentsRepository.items).toHaveLength(0);
  });

  it("not should be able to register an establishment with duplicated cnpj", async () => {
    const createdEstablishment = makeEstablishment({
      cnpj: Cnpj.create("41437902000177"),
    });

    await inMemoryEstablishmentsRepository.create(createdEstablishment);

    const result = await sut.execute({
      name: "EstablishmentWithTheSameCnpj",
      address: Address.create({
        city: "city-1",
        country: "country-1",
        state: "state-1",
        street: "street-1",
        zipCode: "11111-111",
      }),
      cnpj: Cnpj.create("41.437.902/0001-77"),
      corporateName: "Establishment-2",
      socialReason: "SOCIAL REASON TEST LTDA",
      email: new Email("jondoe@example.com"),
      operatingHours: makeOperatingHours(),
      password: "jondoe@123",
      phone: "11111111111",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceAlreadyExistsError);

    expect(inMemoryEstablishmentsRepository.items[0]).toBe(
      createdEstablishment,
    );
    expect(inMemoryEstablishmentsRepository.items).toHaveLength(1);

    expect(inMemoryUsersRepository.items).toHaveLength(0);
  });

  it("not should be able to build the use case input with invalid email", () => {
    expect(() =>
      sut.execute({
        name: "Jon Doe",
        address: Address.create({
          city: "city-1",
          country: "country-1",
          state: "state-1",
          street: "street-1",
          zipCode: "11111-111",
        }),
        cnpj: Cnpj.create("18472512000116"),
        corporateName: "Establishment-1",
        socialReason: "SOCIAL REASON TEST LTDA",
        email: new Email("invalid-format"),
        operatingHours: makeOperatingHours(),
        password: "jondoe@123",
        phone: "11111111111",
      }),
    ).toThrow("Invalid email address: invalid-format");

    expect(inMemoryUsersRepository.items).toHaveLength(0);
    expect(inMemoryEstablishmentsRepository.items).toHaveLength(0);
  });

  it("not should be able to build the use case input with invalid cnpj", () => {
    expect(() =>
      sut.execute({
        name: "Jon Doe",
        address: Address.create({
          city: "city-1",
          country: "country-1",
          state: "state-1",
          street: "street-1",
          zipCode: "11111-111",
        }),
        cnpj: Cnpj.create("05027115000191"),
        corporateName: "Establishment-1",
        socialReason: "SOCIAL REASON TEST LTDA",
        email: new Email("validemail@example.com"),
        operatingHours: makeOperatingHours(),
        password: "jondoe@123",
        phone: "11111111111",
      }),
    ).toThrow("Invalid CNPJ: 05027115000191");

    expect(inMemoryUsersRepository.items).toHaveLength(0);
    expect(inMemoryEstablishmentsRepository.items).toHaveLength(0);
  });
});
