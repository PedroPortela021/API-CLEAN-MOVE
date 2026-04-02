import { InvalidPhoneError, Phone } from "./phone";

describe("Phone", () => {
  it("should be able to create a valid mobile phone", () => {
    const phone = Phone.create("11987654321");

    expect(phone.value).toBe("11987654321");
    expect(phone.formatted).toBe("(11) 98765-4321");
  });

  it("should be able to create a valid landline phone", () => {
    const phone = Phone.create("1134567890");

    expect(phone.value).toBe("1134567890");
    expect(phone.formatted).toBe("(11) 3456-7890");
  });

  it("should normalize phone when creating with mask", () => {
    const phone = Phone.create("(11) 98765-4321");

    expect(phone.value).toBe("11987654321");
    expect(phone.toString()).toBe("11987654321");
  });

  it("should not allow phone with invalid length", () => {
    expect(() => Phone.create("119876543")).toThrow(InvalidPhoneError);
    expect(() => Phone.create("119876543210")).toThrow(InvalidPhoneError);
  });

  it("should not allow repeated digits", () => {
    expect(() => Phone.create("11111111111")).toThrow(InvalidPhoneError);
  });

  it("should not allow DDD starting with zero", () => {
    expect(() => Phone.create("01987654321")).toThrow(InvalidPhoneError);
  });

  it("should compare equality by value", () => {
    const first = Phone.create("(11) 98765-4321");
    const second = Phone.create("11987654321");

    expect(first.equals(second)).toBe(true);
  });
});
