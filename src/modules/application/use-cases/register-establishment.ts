import { Either, left, right } from "../../../shared/either";
import { ResourceAlreadyExistsError } from "../../../shared/errors/resource-already-exists-error";
import { User } from "../../accounts/domain/entities/user";
import { Address } from "../../accounts/domain/value-objects/address";
import { Email } from "../../accounts/domain/value-objects/email";
import { Phone } from "../../accounts/domain/value-objects/phone";
import { UserRole } from "../../accounts/domain/value-objects/user-role";
import { Establishment } from "../../establishments/domain/entities/establishment";
import { Cnpj } from "../../establishments/domain/value-objects/cnpj";
import { OperatingHours } from "../../establishments/domain/value-objects/operating-hours";
import { EstablishmentsRepository } from "../repositories/establishment-repository";
import { HashGenerator } from "../repositories/hash-generator";
import { UsersRepository } from "../repositories/users-repository";

type RegisterEstablishmentUseCaseRequest = {
  name: string;
  corporateName: string;
  socialReason: string;
  email: Email;
  password: string;
  cnpj: Cnpj;
  operatingHours: OperatingHours;
  phone: Phone;
  address: Address;
};

type RegisterEstablishmentUseCaseResponse = Either<
  ResourceAlreadyExistsError,
  {
    establishment: Establishment;
  }
>;

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
    email,
    password,
    cnpj,
    operatingHours,
    phone,
    address,
  }: RegisterEstablishmentUseCaseRequest): Promise<RegisterEstablishmentUseCaseResponse> {
    const [establishmentWithTheSameCnpj, userWithTheSameEmail] =
      await Promise.all([
        this.establishmentsRepository.findByCnpj(cnpj.toString()),
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
