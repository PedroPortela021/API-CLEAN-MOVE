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
  function makeValidBrazilPhone() {
    // Regras do VO `Phone`:
    // - aceita 10 ou 11 dígitos
    // - DDD: não pode conter 0 nas posições
    // - mobile (11): subscriber começa com 9 e tem 9 dígitos
    // - landline (10): subscriber começa com 2-9 e tem 8 dígitos
    const ddd = `${faker.number.int({ min: 1, max: 9 })}${faker.number.int({ min: 1, max: 9 })}`;
    const isMobile = faker.datatype.boolean();

    if (isMobile) {
      const rest = faker.number.int({ min: 0, max: 99999999 });
      const subscriber = `9${rest.toString().padStart(8, "0")}`;
      return `${ddd}${subscriber}`;
    }

    const subscriberStart = faker.number.int({ min: 2, max: 9 });
    const rest = faker.number.int({ min: 0, max: 9999999 });
    const subscriber = `${subscriberStart}${rest.toString().padStart(7, "0")}`;
    return `${ddd}${subscriber}`;
  }

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
      phone: Phone.create(makeValidBrazilPhone()),
      role,
      ...override,
    },
    id,
  );

  return user;
}
