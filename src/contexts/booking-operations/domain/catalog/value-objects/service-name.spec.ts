import { InvalidServiceNameError, ServiceName } from "./service-name";

describe("ServiceName", () => {
  it("should be able to create a valid service name", () => {
    const serviceName = ServiceName.create("Lavagem simples");

    expect(serviceName.value).toBe("Lavagem simples");
    expect(serviceName.toString()).toBe("Lavagem simples");
  });

  it("should normalize the service name by trimming blank spaces", () => {
    const serviceName = ServiceName.create("  Lavagem premium  ");

    expect(serviceName.value).toBe("Lavagem premium");
  });

  it("should not allow an empty service name", () => {
    expect(() => ServiceName.create("   ")).toThrow(InvalidServiceNameError);
  });

  it("should not allow a service name longer than 72 characters", () => {
    expect(() => ServiceName.create("a".repeat(73))).toThrow(
      InvalidServiceNameError,
    );
  });
});
