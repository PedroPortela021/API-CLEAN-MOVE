import { PrismaUserMapper } from "../../src/infra/database/prisma/mappers/prisma-user-mapper";
import { PrismaService } from "../../src/infra/database/prisma/prisma.service";
import {
  User,
  UserProps,
} from "../../src/modules/accounts/domain/entities/user";
import { Address } from "../../src/modules/accounts/domain/value-objects/address";
import { Email } from "../../src/modules/accounts/domain/value-objects/email";
import { Phone } from "../../src/modules/accounts/domain/value-objects/phone";
import { UserRole } from "../../src/modules/accounts/domain/value-objects/user-role";
import { HashGenerator } from "../../src/modules/application/repositories/hash-generator";
import { UniqueEntityId } from "../../src/shared/entities/unique-entity-id";
import {
  makeCity,
  makeCountry,
  makeEmail,
  makeFullName,
  makePassword,
  makeState,
  makeStreet,
  makeZipCode,
  randomBoolean,
  randomIntInclusive,
} from "./random-data";

export function makeUser(
  role: UserRole,
  override?: Partial<UserProps>,
  id?: UniqueEntityId,
) {
  function makeValidBrazilPhone() {
    const ddd = `${randomIntInclusive(1, 9)}${randomIntInclusive(1, 9)}`;
    const isMobile = randomBoolean();

    if (isMobile) {
      const rest = randomIntInclusive(0, 99999999);
      const subscriber = `9${rest.toString().padStart(8, "0")}`;
      return `${ddd}${subscriber}`;
    }

    const subscriberStart = randomIntInclusive(2, 9);
    const rest = randomIntInclusive(0, 9999999);
    const subscriber = `${subscriberStart}${rest.toString().padStart(7, "0")}`;
    return `${ddd}${subscriber}`;
  }

  const user = User.create(
    {
      name: makeFullName(),
      address: Address.create({
        city: makeCity(),
        country: makeCountry(),
        state: makeState(),
        street: makeStreet(),
        zipCode: makeZipCode(),
      }),
      email: new Email(makeEmail()),
      hashedPassword: makePassword(),
      phone: Phone.create(makeValidBrazilPhone()),
      role,
      ...override,
    },
    id,
  );

  return user;
}

type MakePrismaUserOptions = {
  role: UserRole;
  plainPassword?: string | null;
  override?: Omit<Partial<UserProps>, "hashedPassword">;
  id?: UniqueEntityId;
};

export class UserFactory {
  constructor(
    private prisma: PrismaService,
    private hashGenerator: HashGenerator,
  ) {}

  async makePrismaUser({
    role,
    plainPassword = makePassword(),
    override,
    id,
  }: MakePrismaUserOptions) {
    const hashedPassword =
      plainPassword === null ? null : await this.hashGenerator.hash(plainPassword);
    const user = makeUser(
      role,
      {
        ...override,
        hashedPassword,
      },
      id,
    );

    await this.prisma.user.create({
      data: PrismaUserMapper.toPrisma(user),
    });

    return {
      user,
      plainPassword,
    };
  }
}
