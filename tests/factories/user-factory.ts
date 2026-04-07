import {
  User,
  UserProps,
} from "../../src/modules/accounts/domain/entities/user";
import { Address } from "../../src/modules/accounts/domain/value-objects/address";
import { Email } from "../../src/modules/accounts/domain/value-objects/email";
import { Phone } from "../../src/modules/accounts/domain/value-objects/phone";
import { UserRole } from "../../src/modules/accounts/domain/value-objects/user-role";
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
