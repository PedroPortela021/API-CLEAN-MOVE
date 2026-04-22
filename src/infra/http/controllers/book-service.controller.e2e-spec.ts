import { randomUUID } from "node:crypto";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import z from "zod";

import { CustomerFactory } from "../../../../tests/factories/customer-factory";
import { EstablishmentFactory } from "../../../../tests/factories/establishment-factory";
import { ServiceFactory } from "../../../../tests/factories/service-factory";
import { UserFactory } from "../../../../tests/factories/user-factory";
import {
  authResponseSchema,
  getHttpServer,
  makeRefreshTokenCookieHeader,
} from "../../../../tests/helpers/auth-session.e2e-helpers";
import {
  arrangeBookingContext,
  BookingContext,
  loginAsCustomer,
  loginAsEstablishment,
} from "../../../../tests/helpers/booking.e2e-helpers";
import { expectSingleMessageResponseWithoutIssues } from "../../../../tests/helpers/http-response-assertions";
import { HashGenerator } from "../../../modules/application/repositories/hash-generator";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../database/prisma/prisma.service";

const appointmentResponseSchema = z.object({
  id: z.uuid(),
  establishmentId: z.uuid(),
  customerId: z.uuid(),
  bookedByCustomer: z.boolean(),
  service: z.object({
    id: z.uuid(),
    name: z.string().min(1),
    category: z.string().min(1),
    durationInMinutes: z.number().int().positive(),
    priceInCents: z.number().int().nonnegative(),
  }),
  slot: z.object({
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
  }),
  status: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  confirmedAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  expiredAt: z.string().nullable(),
  reservationExpiresAt: z.string().nullable(),
});

const createAppointmentResponseSchema = z.object({
  appointment: appointmentResponseSchema,
});

const mondayMorningStartsAt = "2099-04-06T10:00:00";
const mondaySameSlotStartsAt = "2099-04-06T10:00:00";
const mondayOverlappedStartsAt = "2099-04-06T10:30:00";
const mondayAwaitingPaymentStartsAt = "2099-04-06T11:00:00";
const mondayReservationExpiresAt = "2099-04-06T10:45:00";
const sundayClosedStartsAt = "2099-04-05T10:00:00";

function makeBookServicePayload(
  context: BookingContext,
  override?: Partial<{
    customerId: string;
    serviceId: string;
    startsAt: string;
    reservationExpiresAt: string | null;
  }>,
) {
  const payload = {
    customerId: context.customer.id.toString(),
    serviceId: context.service.id.toString(),
    startsAt: mondayMorningStartsAt,
    ...override,
  };

  if (payload.reservationExpiresAt === undefined) {
    return payload;
  }

  return payload;
}

describe("BookServiceController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let hashGenerator: HashGenerator;
  let userFactory: UserFactory;
  let customerFactory: CustomerFactory;
  let establishmentFactory: EstablishmentFactory;
  let serviceFactory: ServiceFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = moduleRef.get(PrismaService);
    hashGenerator = moduleRef.get(HashGenerator);
    userFactory = new UserFactory(prisma, hashGenerator);
    customerFactory = new CustomerFactory(prisma);
    establishmentFactory = new EstablishmentFactory(prisma);
    serviceFactory = new ServiceFactory(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return 404 when trying to create an appointment with a non-existent customerId", async () => {
    const context = await arrangeBookingContext({
      userFactory,
      customerFactory,
      establishmentFactory,
      serviceFactory,
    });
    const establishmentLogin = await loginAsEstablishment({
      app,
      prisma,
      context,
    });

    const response = await request(getHttpServer(app))
      .post("/appointment")
      .set(
        "Authorization",
        `Bearer ${establishmentLogin.loginBody.accessToken}`,
      )
      .send(
        makeBookServicePayload(context, {
          customerId: randomUUID(),
        }),
      );

    expect(response.status).toBe(404);
    expectSingleMessageResponseWithoutIssues(
      response.body,
      "Resource not found: customer.",
    );
    expect(await prisma.appointment.count()).toBe(0);
  });

  it("should return 404 when trying to create an appointment with a non-existent serviceId", async () => {
    const context = await arrangeBookingContext({
      userFactory,
      customerFactory,
      establishmentFactory,
      serviceFactory,
    });
    const establishmentLogin = await loginAsEstablishment({
      app,
      prisma,
      context,
    });

    const response = await request(getHttpServer(app))
      .post("/appointment")
      .set(
        "Authorization",
        `Bearer ${establishmentLogin.loginBody.accessToken}`,
      )
      .send(
        makeBookServicePayload(context, {
          serviceId: randomUUID(),
        }),
      );

    expect(response.status).toBe(404);
    expectSingleMessageResponseWithoutIssues(
      response.body,
      "Resource not found: service.",
    );
    expect(await prisma.appointment.count()).toBe(0);
  });

  it("should return 403 when trying to create an appointment authenticated as a customer", async () => {
    const context = await arrangeBookingContext({
      userFactory,
      customerFactory,
      establishmentFactory,
      serviceFactory,
    });
    const customerLogin = await loginAsCustomer({
      app,
      prisma,
      context,
    });

    const response = await request(getHttpServer(app))
      .post("/appointment")
      .set("Authorization", `Bearer ${customerLogin.loginBody.accessToken}`)
      .send(makeBookServicePayload(context));

    expect(response.status).toBe(403);
    expectSingleMessageResponseWithoutIssues(
      response.body,
      "Forbidden resource",
    );
    expect(await prisma.appointment.count()).toBe(0);
  });

  it("should return 401 when trying to create an appointment without an access token", async () => {
    const context = await arrangeBookingContext({
      userFactory,
      customerFactory,
      establishmentFactory,
      serviceFactory,
    });

    const response = await request(getHttpServer(app))
      .post("/appointment")
      .send(makeBookServicePayload(context));

    expect(response.status).toBe(401);
    expectSingleMessageResponseWithoutIssues(
      response.body,
      "Missing access token.",
    );
    expect(await prisma.appointment.count()).toBe(0);
  });

  it("should create an appointment after refreshing the session when the first attempt fails without an access token", async () => {
    const context = await arrangeBookingContext({
      userFactory,
      customerFactory,
      establishmentFactory,
      serviceFactory,
    });
    const establishmentLogin = await loginAsEstablishment({
      app,
      prisma,
      context,
    });

    const firstAttempt = await request(getHttpServer(app))
      .post("/appointment")
      .send(makeBookServicePayload(context));

    expect(firstAttempt.status).toBe(401);
    expectSingleMessageResponseWithoutIssues(
      firstAttempt.body,
      "Missing access token.",
    );

    const refreshResponse = await request(getHttpServer(app))
      .post("/auth/refresh")
      .set(
        "Cookie",
        makeRefreshTokenCookieHeader(establishmentLogin.refreshToken),
      );
    const refreshBody = authResponseSchema.parse(refreshResponse.body);

    expect(refreshResponse.status).toBe(200);

    const secondAttempt = await request(getHttpServer(app))
      .post("/appointment")
      .set("Authorization", `Bearer ${refreshBody.accessToken}`)
      .send(makeBookServicePayload(context));
    const secondAttemptBody = createAppointmentResponseSchema.parse(
      secondAttempt.body,
    );

    expect(secondAttempt.status).toBe(201);

    const createdAppointment = await prisma.appointment.findUnique({
      where: {
        id: secondAttemptBody.appointment.id,
      },
    });

    expect(createdAppointment).not.toBeNull();
    expect(createdAppointment?.status).toBe("SCHEDULED");
    expect(secondAttemptBody.appointment.customerId).toBe(
      context.customer.id.toString(),
    );
  });

  it("should create an appointment without reservationExpiresAt when the payload is valid", async () => {
    const context = await arrangeBookingContext({
      userFactory,
      customerFactory,
      establishmentFactory,
      serviceFactory,
    });
    const establishmentLogin = await loginAsEstablishment({
      app,
      prisma,
      context,
    });

    const response = await request(getHttpServer(app))
      .post("/appointment")
      .set(
        "Authorization",
        `Bearer ${establishmentLogin.loginBody.accessToken}`,
      )
      .send(makeBookServicePayload(context));
    const responseBody = createAppointmentResponseSchema.parse(response.body);

    expect(response.status).toBe(201);

    const createdAppointment = await prisma.appointment.findUnique({
      where: {
        id: responseBody.appointment.id,
      },
    });

    expect(createdAppointment).not.toBeNull();
    expect(responseBody.appointment.id).toBe(createdAppointment?.id);
    expect(responseBody.appointment.customerId).toBe(
      context.customer.id.toString(),
    );
    expect(responseBody.appointment.establishmentId).toBe(
      context.establishment.id.toString(),
    );
    expect(responseBody.appointment.bookedByCustomer).toBe(false);
    expect(responseBody.appointment.service).toEqual({
      id: context.service.id.toString(),
      name: context.service.serviceName.value,
      category: context.service.category,
      durationInMinutes: context.service.estimatedDuration.maxInMinutes,
      priceInCents: context.service.price.amountInCents,
    });
    expect(responseBody.appointment.slot.startsAt).toBe(
      createdAppointment?.startsAt.toISOString(),
    );
    expect(responseBody.appointment.slot.endsAt).toBe(
      createdAppointment?.endsAt.toISOString(),
    );
    expect(responseBody.appointment.status).toBe("SCHEDULED");
    expect(responseBody.appointment.reservationExpiresAt).toBeNull();
    expect(createdAppointment?.customerId).toBe(context.customer.id.toString());
    expect(createdAppointment?.establishmentId).toBe(
      context.establishment.id.toString(),
    );
    expect(createdAppointment?.bookedServiceId).toBe(
      context.service.id.toString(),
    );
    expect(createdAppointment?.bookedByCustomer).toBe(false);
    expect(createdAppointment?.status).toBe("SCHEDULED");
    expect(createdAppointment?.reservationExpiresAt).toBeNull();
  });

  it("should create an appointment awaiting payment when reservationExpiresAt is provided", async () => {
    const context = await arrangeBookingContext({
      userFactory,
      customerFactory,
      establishmentFactory,
      serviceFactory,
    });
    const establishmentLogin = await loginAsEstablishment({
      app,
      prisma,
      context,
    });

    const response = await request(getHttpServer(app))
      .post("/appointment")
      .set(
        "Authorization",
        `Bearer ${establishmentLogin.loginBody.accessToken}`,
      )
      .send(
        makeBookServicePayload(context, {
          startsAt: mondayAwaitingPaymentStartsAt,
          reservationExpiresAt: mondayReservationExpiresAt,
        }),
      );
    const responseBody = createAppointmentResponseSchema.parse(response.body);

    expect(response.status).toBe(201);

    const createdAppointment = await prisma.appointment.findUnique({
      where: {
        id: responseBody.appointment.id,
      },
    });

    expect(createdAppointment).not.toBeNull();
    expect(responseBody.appointment.status).toBe("AWAITING_PAYMENT");
    expect(responseBody.appointment.reservationExpiresAt).toBe(
      new Date(mondayReservationExpiresAt).toISOString(),
    );
    expect(createdAppointment?.status).toBe("AWAITING_PAYMENT");
    expect(createdAppointment?.reservationExpiresAt?.getTime()).toBe(
      new Date(mondayReservationExpiresAt).getTime(),
    );
  });

  it("should return 409 when trying to create an appointment at the exact same time slot", async () => {
    const context = await arrangeBookingContext({
      userFactory,
      customerFactory,
      establishmentFactory,
      serviceFactory,
    });
    const establishmentLogin = await loginAsEstablishment({
      app,
      prisma,
      context,
    });
    const exactPayload = makeBookServicePayload(context, {
      startsAt: mondaySameSlotStartsAt,
    });

    const firstResponse = await request(getHttpServer(app))
      .post("/appointment")
      .set(
        "Authorization",
        `Bearer ${establishmentLogin.loginBody.accessToken}`,
      )
      .send(exactPayload);

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(getHttpServer(app))
      .post("/appointment")
      .set(
        "Authorization",
        `Bearer ${establishmentLogin.loginBody.accessToken}`,
      )
      .send(exactPayload);

    expect(secondResponse.status).toBe(409);
    expectSingleMessageResponseWithoutIssues(
      secondResponse.body,
      "This time slot is already booked.",
    );
    expect(await prisma.appointment.count()).toBe(1);
  });

  it("should return 409 when trying to create overlapping appointments with different startsAt values", async () => {
    const context = await arrangeBookingContext({
      userFactory,
      customerFactory,
      establishmentFactory,
      serviceFactory,
    });
    const establishmentLogin = await loginAsEstablishment({
      app,
      prisma,
      context,
    });

    const firstResponse = await request(getHttpServer(app))
      .post("/appointment")
      .set(
        "Authorization",
        `Bearer ${establishmentLogin.loginBody.accessToken}`,
      )
      .send(
        makeBookServicePayload(context, {
          startsAt: mondayMorningStartsAt,
        }),
      );

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(getHttpServer(app))
      .post("/appointment")
      .set(
        "Authorization",
        `Bearer ${establishmentLogin.loginBody.accessToken}`,
      )
      .send(
        makeBookServicePayload(context, {
          startsAt: mondayOverlappedStartsAt,
        }),
      );

    expect(secondResponse.status).toBe(409);
    expectSingleMessageResponseWithoutIssues(
      secondResponse.body,
      "This time slot is already booked.",
    );
    expect(await prisma.appointment.count()).toBe(1);
  });

  it("should return 400 when trying to create an appointment outside the establishment operating hours", async () => {
    const context = await arrangeBookingContext({
      userFactory,
      customerFactory,
      establishmentFactory,
      serviceFactory,
    });
    const establishmentLogin = await loginAsEstablishment({
      app,
      prisma,
      context,
    });

    const response = await request(getHttpServer(app))
      .post("/appointment")
      .set(
        "Authorization",
        `Bearer ${establishmentLogin.loginBody.accessToken}`,
      )
      .send(
        makeBookServicePayload(context, {
          startsAt: sundayClosedStartsAt,
        }),
      );

    expect(response.status).toBe(400);
    expectSingleMessageResponseWithoutIssues(
      response.body,
      "This establishment is not open during these hours. Please choose another time.",
    );
    expect(await prisma.appointment.count()).toBe(0);
  });

  it("should return 400 when reservationExpiresAt is not a future date", async () => {
    const context = await arrangeBookingContext({
      userFactory,
      customerFactory,
      establishmentFactory,
      serviceFactory,
    });
    const establishmentLogin = await loginAsEstablishment({
      app,
      prisma,
      context,
    });

    const response = await request(getHttpServer(app))
      .post("/appointment")
      .set(
        "Authorization",
        `Bearer ${establishmentLogin.loginBody.accessToken}`,
      )
      .send(
        makeBookServicePayload(context, {
          reservationExpiresAt: "2000-04-06T10:15:00",
        }),
      );

    expect(response.status).toBe(400);
    expectSingleMessageResponseWithoutIssues(
      response.body,
      "reservationExpiresAt must be a future date.",
    );
    expect(await prisma.appointment.count()).toBe(0);
  });
});
