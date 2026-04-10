import { Injectable } from "@nestjs/common";
import { Either, left, right } from "../../../../shared/either";
import { ResourceAlreadyExistsError } from "../../../../shared/errors/resource-already-exists-error";
import { UnexpectedDomainError } from "../../../../shared/errors/unexpected-domain-error";
import { User } from "../../../accounts/domain/entities/user";
import {
  Address,
  AddressProps,
  InvalidAddressError,
} from "../../../accounts/domain/value-objects/address";
import {
  Email,
  InvalidEmailError,
} from "../../../accounts/domain/value-objects/email";
import {
  InvalidPhoneError,
  Phone,
} from "../../../accounts/domain/value-objects/phone";
import { UserRole } from "../../../accounts/domain/value-objects/user-role";
import { Establishment } from "../../../establishments/domain/entities/establishment";
import { InvalidRegisterEstablishmentInputError } from "../../../establishments/domain/errors/invalid-register-establishment-input-error";
import {
  Cnpj,
  InvalidCnpjError,
} from "../../../establishments/domain/value-objects/cnpj";
import {
  InvalidOperatingHoursError,
  OperatingHours,
  OperatingHoursProps,
} from "../../../establishments/domain/value-objects/operating-hours";
import { Slug } from "../../../establishments/domain/value-objects/slug";
import { EstablishmentsRepository } from "../../repositories/establishment-repository";
import { HashGenerator } from "../../repositories/hash-generator";
import { UsersRepository } from "../../repositories/users-repository";

type RegisterEstablishmentUseCaseRequest = {
  name: string;
  corporateName: string;
  socialReason: string;
  email: string;
  password: string;
  cnpj: string;
  operatingHours: OperatingHoursProps;
  phone: string;
  address: AddressProps;
  slug?: string | undefined;
};

type RegisterEstablishmentUseCaseResponse = Either<
  | ResourceAlreadyExistsError
  | InvalidRegisterEstablishmentInputError
  | UnexpectedDomainError,
  {
    establishment: Establishment;
  }
>;

@Injectable()
export class RegisterEstablishmentUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private establishmentsRepository: EstablishmentsRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    name,
    corporateName,
    socialReason,
    email: rawEmail,
    password,
    cnpj: rawCnpj,
    operatingHours: rawOperatingHours,
    phone: rawPhone,
    address: rawAddress,
    slug: rawSlug,
  }: RegisterEstablishmentUseCaseRequest): Promise<RegisterEstablishmentUseCaseResponse> {
    const slug = rawSlug
      ? Slug.create(rawSlug)
      : Slug.createFromText(corporateName);

    let email;
    let cnpj;
    let operatingHours;
    let phone;
    let address;

    try {
      email = new Email(rawEmail);
      cnpj = Cnpj.create(rawCnpj);
      operatingHours = OperatingHours.create(rawOperatingHours);
      phone = Phone.create(rawPhone);
      address = Address.create(rawAddress);
    } catch (error) {
      if (
        error instanceof InvalidEmailError ||
        error instanceof InvalidCnpjError ||
        error instanceof InvalidOperatingHoursError ||
        error instanceof InvalidPhoneError ||
        error instanceof InvalidAddressError
      ) {
        return left(new InvalidRegisterEstablishmentInputError(error.message));
      }

      return left(new UnexpectedDomainError());
    }

    const [establishmentWithTheSameCnpj, userWithTheSameEmail] =
      await Promise.all([
        this.establishmentsRepository.findBySlugAndCnpj(cnpj.value, slug.value),
        this.usersRepository.findByEmail(email.toString()),
      ]);

    if (establishmentWithTheSameCnpj || userWithTheSameEmail) {
      return left(
        new ResourceAlreadyExistsError("Establishment already registered."),
      );
    }

    const userRole: UserRole = "ESTABLISHMENT";

    const hashedPassword = await this.hashGenerator.hash(password);

    const userInputValues = {
      name,
      email,
      hashedPassword,
      role: userRole,
      phone,
      address,
    };

    const user = User.create(userInputValues);

    const establishment = Establishment.create({
      ownerId: user.id,
      cnpj,
      corporateName,
      socialReason,
      operatingHours,
      slug,
    });

    await Promise.all([
      this.usersRepository.create(user),
      this.establishmentsRepository.create(establishment),
    ]);

    return right({
      establishment,
    });
  }
}
