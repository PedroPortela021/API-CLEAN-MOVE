import { ResourceNotFoundError } from "../../../shared/errors/resource-not-found-error";
import { makeEstablishment } from "../../../tests/factories/establishment-factory";
import { InMemoryEstablishmentsRepository } from "../../../tests/repositories/in-memory-establishment-repository";
import { InMemoryServicesRepository } from "../../../tests/repositories/in-memory-services-repository";
import { CreateServiceUseCase } from "./create-service";

let inMemoryServicesRepository: InMemoryServicesRepository;
let inMemoryEstablishmentsRepository: InMemoryEstablishmentsRepository;

let sut: CreateServiceUseCase;

describe("Create a service", () => {
  beforeEach(() => {
    inMemoryServicesRepository = new InMemoryServicesRepository();
    inMemoryEstablishmentsRepository = new InMemoryEstablishmentsRepository();

    sut = new CreateServiceUseCase(
      inMemoryServicesRepository,
      inMemoryEstablishmentsRepository,
    );
  });

  it("should be able to create a service with an estimated duration range", async () => {
    const establishment = makeEstablishment();

    await inMemoryEstablishmentsRepository.create(establishment);

    const result = await sut.execute({
      establishmentId: establishment.id.toString(),
      serviceName: "Lavagem simples",
      description:
        "Lavagem externa com lavadora de pressao, shampoo proprio e secagem com pano de microfibra.",
      category: "WASH",
      estimatedDuration: {
        minInMinutes: 30,
        maxInMinutes: 60,
      },
      price: 3000,
    });

    expect(result.isRight()).toBe(true);

    if (result.isLeft()) {
      throw result.value;
    }

    const { service } = result.value;

    expect(inMemoryServicesRepository.items[0]).toBe(result.value.service);
    expect(service.establishmentId.toString()).toBe(
      establishment.id.toString(),
    );
    expect(service.estimatedDuration.minInMinutes).toBe(30);
    expect(service.estimatedDuration.maxInMinutes).toBe(60);
    expect(service.estimatedDuration.formatted).toBe("30 - 60 min");
    expect(result.value.service.price.value).toBe(30);
  });

  it("should not be able to create a service for a non-existent establishment", async () => {
    const result = await sut.execute({
      establishmentId: "non-existent-establishment",
      serviceName: "Lavagem tecnica",
      description: "Lavagem detalhada",
      category: "WASH",
      estimatedDuration: {
        minInMinutes: 45,
        maxInMinutes: 90,
      },
      price: 5000,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    expect(inMemoryServicesRepository.items).toHaveLength(0);
  });
});
