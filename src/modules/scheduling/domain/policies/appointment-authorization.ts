import { Appointment } from "../entities/appointment";

export type AppointmentAuthor =
  | {
      authorType: "CUSTOMER";
      authorId: string;
    }
  | {
      authorType: "ESTABLISHMENT";
      authorId: string;
    };

export function isAppointmentAuthor(
  appointment: Appointment,
  author: AppointmentAuthor,
) {
  if (author.authorType === "CUSTOMER") {
    return appointment.customerId.toString() === author.authorId;
  }

  return appointment.establishmentId.toString() === author.authorId;
}
