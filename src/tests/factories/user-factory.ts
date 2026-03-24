import { User, UserProps } from "../../modules/accounts/domain/entities/user";
import { Address } from "../../modules/accounts/domain/value-objects/address";
import { Email } from "../../modules/accounts/domain/value-objects/email";
import { Phone } from "../../modules/accounts/domain/value-objects/phone";
import { UserRole } from "../../modules/accounts/domain/value-objects/user-role";
import { UniqueEntityId } from "../../shared/entities/unique-entity-id";
import { faker } from "@faker-js/faker";

export function makeUser(
  role: UserRole,
  override?: Partial<UserProps>,
  id?: UniqueEntityId,
) {
  const user = User.create(
    {
      name: faker.person.fullName(),
      address: Address.create({
        city: faker.location.city(),
        country: faker.location.country(),
        state: faker.location.state(),
        street: faker.location.street(),
        zipCode: faker.location.zipCode({ format: "#####-###" }),
      }),
      email: new Email(faker.internet.email()),
      hashedPassword: faker.internet.password(),
      phone: Phone.create(faker.phone.number({ style: "national" })),
      role,
      ...override,
    },
    id,
  );

  return user;
}
