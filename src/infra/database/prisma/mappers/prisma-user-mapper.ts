import z from "zod";
import {
  Prisma,
  User as PrismaUser,
} from "../../../../generated/prisma/browser";
import { User } from "../../../../modules/accounts/domain/entities/user";
import { Address } from "../../../../modules/accounts/domain/value-objects/address";
import { Email } from "../../../../modules/accounts/domain/value-objects/email";
import { Phone } from "../../../../modules/accounts/domain/value-objects/phone";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";

const addressSchema = z.object({
  street: z.string(),
  country: z.string(),
  state: z.string(),
  zipCode: z.string(),
  city: z.string(),
});

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    const address =
      raw.address === null
        ? null
        : Address.create(addressSchema.parse(raw.address));

    return User.create(
      {
        name: raw.name,
        email: new Email(raw.email),
        hashedPassword: raw.hashedPassword,
        role: raw.role,
        phone: raw.phone ? Phone.create(raw.phone) : null,
        address,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(raw: User): Prisma.UserUncheckedCreateInput {
    const address =
      raw.address === null
        ? undefined
        : ({
            street: raw.address.street,
            country: raw.address.country,
            state: raw.address.state,
            zipCode: raw.address.zipCode,
            city: raw.address.city,
          } satisfies Prisma.InputJsonObject);

    return {
      id: raw.id.toString(),
      name: raw.name,
      email: raw.email.toString(),
      hashedPassword: raw.hashedPassword,
      role: raw.role,
      phone: raw.phone?.toString() ?? null,
      ...(address && { address }),
    };
  }
}
