export class TimeSlotAlreadyBookedError extends Error {
  constructor(message?: string) {
    super(message ?? "This time slot is already booked.");
    this.name = "TimeSlotAlreadyBookedError";
  }
}
