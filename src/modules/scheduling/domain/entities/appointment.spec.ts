import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { InvalidAppointmentPaymentWindowError } from "../errors/invalid-appointment-payment-window-error";
import { BookedServiceSnapshot } from "../value-objects/booked-service-snapshot";
import { TimeSlot } from "../value-objects/time-slot";
import { Appointment } from "./appointment";

function makeBookedServiceSnapshot() {
  return BookedServiceSnapshot.create({
    serviceId: new UniqueEntityId("service-1"),
    serviceName: "Lavagem simples",
    category: "WASH",
    durationInMinutes: 60,
    priceInCents: 30000,
  });
}

function makeSlot() {
  return TimeSlot.create({
    startsAt: new Date("2026-04-06T10:00:00"),
    endsAt: new Date("2026-04-06T11:00:00"),
  });
}

describe("Appointment", () => {
  it("should not allow awaiting-payment appointments with an expired payment window", () => {
    expect(() =>
      Appointment.createAwaitingPayment({
        establishmentId: new UniqueEntityId("establishment-1"),
        customerId: new UniqueEntityId("customer-1"),
        service: makeBookedServiceSnapshot(),
        slot: makeSlot(),
        createdAt: new Date("2026-04-06T10:00:00"),
        reservationExpiresAt: new Date("2026-04-06T10:00:00"),
      }),
    ).toThrow(InvalidAppointmentPaymentWindowError);
  });

  it("should not allow reservationExpiresAt outside awaiting-payment state", () => {
    expect(() =>
      Appointment.create({
        establishmentId: new UniqueEntityId("establishment-1"),
        customerId: new UniqueEntityId("customer-1"),
        service: makeBookedServiceSnapshot(),
        slot: makeSlot(),
        status: "SCHEDULED",
        reservationExpiresAt: new Date("2026-04-06T10:15:00"),
      }),
    ).toThrow(InvalidAppointmentPaymentWindowError);
  });
});
