import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AddressDto {
  @ApiProperty({ example: "Rua das Flores, 123" })
  street!: string;

  @ApiProperty({ example: "Brasil" })
  country!: string;

  @ApiProperty({ example: "SP" })
  state!: string;

  @ApiProperty({ example: "01001-000" })
  zipCode!: string;

  @ApiProperty({ example: "Sao Paulo" })
  city!: string;
}

export class RegisterCustomerBodyDto {
  @ApiProperty({ example: "12345678900" })
  cpf!: string;

  @ApiProperty({ example: "Maria Silva" })
  name!: string;

  @ApiProperty({ example: "maria@example.com" })
  email!: string;

  @ApiProperty({ example: "123456" })
  password!: string;

  @ApiProperty({ example: "+5511999999999" })
  phone!: string;

  @ApiProperty({ type: AddressDto })
  address!: AddressDto;
}

export class RegisterCustomerResponseDto {
  @ApiProperty({
    example: "9f7f5e87-1f82-4d7d-8c3c-90c4f6073d11",
    description: "Created customer identifier.",
  })
  customerId!: string;
}

export class TimeRangeDto {
  @ApiProperty({ example: "08:00" })
  start!: string;

  @ApiProperty({ example: "18:00" })
  end!: string;
}

export class OperatingHoursDayDto {
  @ApiProperty({
    enum: [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ],
    example: "MONDAY",
  })
  day!:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

  @ApiProperty({ type: TimeRangeDto, isArray: true })
  ranges!: TimeRangeDto[];
}

export class OperatingHoursDto {
  @ApiProperty({ type: OperatingHoursDayDto, isArray: true })
  days!: OperatingHoursDayDto[];
}

export class RegisterEstablishmentBodyDto {
  @ApiProperty({ example: "Studio Clean Move" })
  name!: string;

  @ApiProperty({ example: "Studio Clean Move LTDA" })
  corporateName!: string;

  @ApiProperty({ example: "Studio Clean Move Servicos de Beleza" })
  socialReason!: string;

  @ApiProperty({ example: "contato@cleanmove.com" })
  email!: string;

  @ApiProperty({ example: "123456" })
  password!: string;

  @ApiProperty({ example: "12345678000199" })
  cnpj!: string;

  @ApiProperty({ example: "+5511988888888" })
  phone!: string;

  @ApiProperty({ type: AddressDto })
  address!: AddressDto;

  @ApiProperty({ type: OperatingHoursDto })
  operatingHours!: OperatingHoursDto;

  @ApiPropertyOptional({
    example: "studio-clean-move",
    description: "Optional public slug for the establishment.",
  })
  slug?: string;
}

export class RegisterEstablishmentResponseDto {
  @ApiProperty({
    example: "2e11b57c-b96a-490a-9ae6-64ef2966fd84",
    description: "Created establishment identifier.",
  })
  establishmentId!: string;
}

export class BookServiceBodyDto {
  @ApiProperty({
    example: "5f588c8b-ef0f-4193-aec0-2926e77c1d09",
    description: "Customer identifier.",
  })
  customerId!: string;

  @ApiProperty({
    example: "11cf3860-d512-47db-b9d1-c9044be6250d",
    description: "Service identifier.",
  })
  serviceId!: string;

  @ApiProperty({
    example: "2026-04-22T14:00:00.000Z",
    description: "Appointment start date-time in ISO 8601 format.",
  })
  startsAt!: string;

  @ApiPropertyOptional({
    example: "2026-04-22T14:10:00.000Z",
    nullable: true,
    description: "Optional reservation expiration date-time.",
  })
  reservationExpiresAt?: string | null;
}

export class AppointmentServiceDto {
  @ApiProperty({ example: "11cf3860-d512-47db-b9d1-c9044be6250d" })
  id!: string;

  @ApiProperty({ example: "Corte de cabelo" })
  name!: string;

  @ApiProperty({ example: "HAIR" })
  category!: string;

  @ApiProperty({ example: 45 })
  durationInMinutes!: number;

  @ApiProperty({ example: 7500 })
  priceInCents!: number;
}

export class AppointmentSlotDto {
  @ApiProperty({ example: "2026-04-22T14:00:00.000Z" })
  startsAt!: string;

  @ApiProperty({ example: "2026-04-22T14:45:00.000Z" })
  endsAt!: string;
}

export class AppointmentDto {
  @ApiProperty({ example: "63f1d0ee-e8a4-47a8-8a73-0f3764b8731e" })
  id!: string;

  @ApiProperty({ example: "2e11b57c-b96a-490a-9ae6-64ef2966fd84" })
  establishmentId!: string;

  @ApiProperty({ example: "5f588c8b-ef0f-4193-aec0-2926e77c1d09" })
  customerId!: string;

  @ApiProperty({ example: false })
  bookedByCustomer!: boolean;

  @ApiProperty({ type: AppointmentServiceDto })
  service!: AppointmentServiceDto;

  @ApiProperty({ type: AppointmentSlotDto })
  slot!: AppointmentSlotDto;

  @ApiProperty({ example: "PENDING" })
  status!: string;

  @ApiProperty({ example: "2026-04-20T10:00:00.000Z", nullable: true })
  createdAt!: string | null;

  @ApiProperty({ example: "2026-04-20T10:05:00.000Z", nullable: true })
  updatedAt!: string | null;

  @ApiProperty({ example: null, nullable: true })
  confirmedAt!: string | null;

  @ApiProperty({ example: null, nullable: true })
  cancelledAt!: string | null;

  @ApiProperty({ example: null, nullable: true })
  expiredAt!: string | null;

  @ApiProperty({ example: "2026-04-22T14:10:00.000Z", nullable: true })
  reservationExpiresAt!: string | null;
}

export class BookServiceResponseDto {
  @ApiProperty({ type: AppointmentDto })
  appointment!: AppointmentDto;
}
