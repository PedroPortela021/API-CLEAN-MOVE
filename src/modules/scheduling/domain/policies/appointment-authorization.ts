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

export function canBookAppointment({
  author,
  customerId,
  establishmentId,
}: {
  author: AppointmentAuthor;
  customerId: string;
  establishmentId: string;
}) {
  if (author.authorType === "CUSTOMER") {
    return author.authorId === customerId;
  }

  return author.authorId === establishmentId;
}

export function canAdvanceAppointmentStatus({
  appointment,
  author,
}: {
  appointment: Appointment;
  author: AppointmentAuthor;
}) {
  return (
    isAppointmentAuthor(appointment, author) &&
    author.authorType === "ESTABLISHMENT"
  );
}
