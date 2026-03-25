import { Cpf, InvalidCpfError } from "./cpf";

describe("Cpf", () => {
  it("should be able to create a valid CPF", () => {
    const cpf = Cpf.create("52998224725");

    expect(cpf.value).toBe("52998224725");
  });

  it("should normalize CPF when creating with mask", () => {
    const cpf = Cpf.create("529.982.247-25");

    expect(cpf.value).toBe("52998224725");
    expect(cpf.toString()).toBe("52998224725");
  });

  it("should return formatted CPF", () => {
    const cpf = Cpf.create("52998224725");

    expect(cpf.formatted).toBe("529.982.247-25");
  });

  it("should not allow CPF with invalid check digits", () => {
    expect(() => Cpf.create("52998224724")).toThrow(InvalidCpfError);
  });

  it("should not allow CPF with repeated digits", () => {
    expect(() => Cpf.create("11111111111")).toThrow(InvalidCpfError);
  });

  it("should not allow CPF with invalid length", () => {
    expect(() => Cpf.create("1234567890")).toThrow(InvalidCpfError);
  });

  it("should compare equality by value", () => {
    const first = Cpf.create("529.982.247-25");
    const second = Cpf.create("52998224725");

    expect(first.equals(second)).toBe(true);
  });
});
