import {
  AppointmentBookingService,
  AppointmentBookingServiceRequest,
  AppointmentBookingServiceResponse,
} from "../../services/appointment-booking-service";

type BookServiceUseCaseRequest = AppointmentBookingServiceRequest;
type BookServiceUseCaseResponse = AppointmentBookingServiceResponse;

export class BookServiceUseCase {
  constructor(private appointmentBookingService: AppointmentBookingService) {}

  async execute(
    params: BookServiceUseCaseRequest,
  ): Promise<BookServiceUseCaseResponse> {
    return this.appointmentBookingService.execute(params);
  }
}
