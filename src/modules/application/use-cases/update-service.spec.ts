import { UniqueEntityId } from "../../../shared/entities/unique-entity-id";
import { NotAllowed } from "../../../shared/errors/not-allowed";
import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { makeEstablishment } from "../../../tests/factories/establishment-factory";
import { makeService } from "../../../tests/factories/service-factory";
import { makeUser } from "../../../tests/factories/user-factory";
import { InMemoryEstablishmentsRepository } from "../../../tests/repositories/in-memory-establishment-repository";
import { InMemoryServicesRepository } from "../../../tests/repositories/in-memory-services-repository";
import { InMemoryUsersRepository } from "../../../tests/repositories/in-memory-users-repository";
import { EstimatedDuration } from "../../catalog/domain/value-objects/estimated-duration";
import { Money } from "../../catalog/domain/value-objects/money";
import { ServiceName } from "../../catalog/domain/value-objects/service-name";
import {
  InvalidServiceUpdateInputError,
  UpdateServiceUseCase,
} from "./update-service";

let inMemoryServicesRepository: InMemoryServicesRepository;
let inMemoryEstablishmentsRepository: InMemoryEstablishmentsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;

let sut: UpdateServiceUseCase;

describe("Update a service", () => {
  beforeEach(() => {
    inMemoryServicesRepository = new InMemoryServicesRepository();
    inMemoryEstablishmentsRepository = new InMemoryEstablishmentsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();

    sut = new UpdateServiceUseCase(
      inMemoryServicesRepository,
      inMemoryEstablishmentsRepository,
      inMemoryUsersRepository,
    );
  });

  it("should be able to update a service with a valid establishment and valid data", async () => {
    const user = makeUser("ESTABLISHMENT");
    await inMemoryUsersRepository.create(user);

    const establishment = makeEstablishment({
      ownerId: user.id,
    });
    await inMemoryEstablishmentsRepository.create(establishment);

    const service = makeService({
      establishmentId: establishment.id,
      serviceName: ServiceName.create("Service to update"),
    });

    const originalUpdatedAt = service.updatedAt!.getTime();

    await inMemoryServicesRepository.create(service);

    const result = await sut.execute({
      establishmentId: establishment.id.toString(),
      serviceId: service.id.toString(),
      data: {
        serviceName: "Service updated",
        price: 50000,
        category: "PROTECTION",
        description: "Service updated description",
        estimatedDuration: {
          minInMinutes: 50,
          maxInMinutes: 100,
        },
      },
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    const { service: resultService } = result.value;
    const newUpdatedAtValue = resultService.updatedAt!.getTime();

    expect(newUpdatedAtValue > originalUpdatedAt);
    expect(inMemoryServicesRepository.items[0]).toBe(resultService);
    expect(resultService.establishmentId.toString()).toBe(
      establishment.id.toString(),
    );
    expect(resultService.serviceName.toString()).toBe("Service updated");
    expect(resultService.price.amountInCents).toBe(50000);
    expect(resultService.category).toBe("PROTECTION");
    expect(resultService.description).toBe("Service updated description");
    expect(resultService.estimatedDuration.minInMinutes).toBe(50);
    expect(resultService.estimatedDuration.maxInMinutes).toBe(100);
    expect(resultService.estimatedDuration.formatted).toBe("50 - 100 min");
  });
  it("should not be able to update a service with a valid establishment and invalid estimatedDuration", async () => {
    const user = makeUser("ESTABLISHMENT");
    await inMemoryUsersRepository.create(user);

    const establishment = makeEstablishment({
      ownerId: user.id,
    });
    await inMemoryEstablishmentsRepository.create(establishment);

    const service = makeService({
      establishmentId: establishment.id,
      serviceName: ServiceName.create("Service to update"),
      estimatedDuration: EstimatedDuration.create({
        minInMinutes: 10,
        maxInMinutes: 30,
      }),
    });

    const originalUpdatedAt = service.updatedAt?.getTime();

    await inMemoryServicesRepository.create(service);

    const result = await sut.execute({
      establishmentId: establishment.id.toString(),
      serviceId: service.id.toString(),
      data: {
        serviceName: "Service updated",
        price: 1,
        category: "PROTECTION",
        description: "Service updated description",
        estimatedDuration: {
          minInMinutes: 35,
        },
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidServiceUpdateInputError);
    expect(
      inMemoryServicesRepository.items[0]?.updatedAt?.getTime() ===
        originalUpdatedAt,
    ).toBe(true);
    expect(
      inMemoryServicesRepository.items[0]?.estimatedDuration.formatted,
    ).toEqual("10 - 30 min");
    expect(inMemoryServicesRepository.items[0]?.serviceName.value).toEqual(
      "Service to update",
    );
  });
  it("should not be able to update a service with an unknown user", async () => {
    const unknownUserId = new UniqueEntityId("unknownUserId");

    const service = makeService({
      establishmentId: unknownUserId,
      serviceName: ServiceName.create("Service to update"),
    });

    await inMemoryServicesRepository.create(service);

    const originalUpdatedAt = service.updatedAt?.getTime();

    const result = await sut.execute({
      establishmentId: unknownUserId.toString(),
      serviceId: service.id.toString(),
      data: {
        serviceName: "Service updated",
        price: 50000,
        category: "PROTECTION",
        description: "Service updated description",
        estimatedDuration: {
          minInMinutes: 50,
          maxInMinutes: 100,
        },
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(
      inMemoryServicesRepository.items[0]?.updatedAt?.getTime() ===
        originalUpdatedAt,
    ).toBe(true);
    expect(inMemoryServicesRepository.items[0]?.serviceName.value).toEqual(
      "Service to update",
    );
  });
  it("should not be able to update a service using an establishment that is not the owner of that service", async () => {
    const user = makeUser("ESTABLISHMENT");
    await inMemoryUsersRepository.create(user);

    const establishmentOwner = makeEstablishment({
      ownerId: user.id,
    });
    await inMemoryEstablishmentsRepository.create(establishmentOwner);

    const service = makeService({
      establishmentId: establishmentOwner.id,
      serviceName: ServiceName.create("Service to update"),
    });
    await inMemoryServicesRepository.create(service);

    const anotherUser = makeUser("ESTABLISHMENT");
    await inMemoryUsersRepository.create(anotherUser);

    const anotherEstablishment = makeEstablishment({
      ownerId: anotherUser.id,
    });
    await inMemoryEstablishmentsRepository.create(anotherEstablishment);

    const originalUpdatedAt = service.updatedAt?.getTime();

    const result = await sut.execute({
      establishmentId: anotherEstablishment.id.toString(),
      serviceId: service.id.toString(),
      data: {
        serviceName: "Service updated",
        price: 50000,
        category: "PROTECTION",
        description: "Service updated description",
        estimatedDuration: {
          minInMinutes: 50,
          maxInMinutes: 100,
        },
      },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowed);
    expect(
      inMemoryServicesRepository.items[0]?.updatedAt?.getTime() ===
        originalUpdatedAt,
    ).toBe(true);
    expect(inMemoryServicesRepository.items[0]?.serviceName.value).toEqual(
      "Service to update",
    );
  });
  it("should be able to update a service with a valid establishment with the same data", async () => {
    const user = makeUser("ESTABLISHMENT");
    await inMemoryUsersRepository.create(user);

    const establishment = makeEstablishment({
      ownerId: user.id,
    });

    await inMemoryEstablishmentsRepository.create(establishment);

    const service = makeService({
      establishmentId: establishment.id,
      serviceName: ServiceName.create("Service to update with same name"),
      category: "WASH",
      description: "Same description",
      estimatedDuration: EstimatedDuration.create({
        minInMinutes: 10,
        maxInMinutes: 20,
      }),
      price: Money.create(3000),
    });

    const originalUpdatedAt = service.updatedAt!.getTime();

    await inMemoryServicesRepository.create(service);

    const result = await sut.execute({
      establishmentId: establishment.id.toString(),
      serviceId: service.id.toString(),
      data: {
        serviceName: "Service to update with same name",
        category: "WASH",
        description: "Same description",
        estimatedDuration: EstimatedDuration.create({
          minInMinutes: 10,
          maxInMinutes: 20,
        }),
        price: 3000,
      },
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    const { service: resultService } = result.value;
    const newUpdatedAtValue = resultService.updatedAt!.getTime();

    expect(newUpdatedAtValue === originalUpdatedAt).toBe(true);
  });
  it("should not be able to update a service using a user whose role is that of a client", async () => {
    const client = makeUser("CUSTOMER");

    const service = makeService({
      establishmentId: client.id,
    });

    await inMemoryServicesRepository.create(service);

    const result = await sut.execute({
      establishmentId: client.id.toString(),
      serviceId: service.id.toString(),
      data: {
        serviceName: "Updated service by client",
        category: "UPHOLSTERY",
        description: "Updated service description",
        estimatedDuration: EstimatedDuration.create({
          minInMinutes: 10,
          maxInMinutes: 20,
        }),
        price: 3000,
      },
    });

    expect(result.isLeft()).toBe(true);
  });
});
