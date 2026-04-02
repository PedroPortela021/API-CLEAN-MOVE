export class InvalidAppointmentStatusTransitionError extends Error {
  constructor(message?: string) {
    super(message ?? "It wasn't possible to change the appointment status.");
  }
}
