import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import z from "zod";

import { PrismaService } from "../../database/prisma/prisma.service";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../app.module";
import { DatabaseModule } from "../../database/database.module";
import { AuthModule } from "../../auth/auth.module";

const registerEstablishmentResponseSchema = z.object({
  establishmentId: z.uuid(),
});

function makeRegisterEstablishmentPayload() {
  return {
    name: "Jon Doe",
    corporateName: "Valid Establishment",
    socialReason: "SOCIAL REASON TEST LTDA",
    email: "jondoe@example.com",
    password: "jondoe@123",
    cnpj: "37.158.666/0001-82",
    phone: "11987654321",
    address: {
      street: "street-1",
      country: "country-1",
      state: "state-1",
      zipCode: "11111-111",
      city: "city-1",
    },
    operatingHours: {
      days: [
        {
          day: "MONDAY",
          ranges: [{ start: "08:00", end: "18:00" }],
        },
        {
          day: "SATURDAY",
          ranges: [{ start: "08:00", end: "12:00" }],
        },
        {
          day: "SUNDAY",
          ranges: [],
        },
      ],
    },
  };
}

function getHttpServer(app: INestApplication): Parameters<typeof request>[0] {
  return app.getHttpServer() as Parameters<typeof request>[0];
}

describe("RegisterEstablishmentController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule, AuthModule],
      providers: [],
    }).compile();

    app = moduleRef.createNestApplication();

    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("should register an establishment and persist the data", async () => {
    const response = await request(getHttpServer(app))
      .post("/register/establishment")
      .send(makeRegisterEstablishmentPayload());
    const responseBody = registerEstablishmentResponseSchema.parse(
      response.body,
    );

    expect(response.status).toBe(201);
    expect(responseBody.establishmentId).toEqual(expect.any(String));

    const createdUser = await prisma.user.findUnique({
      where: {
        email: "jondoe@example.com",
      },
    });

    const createdEstablishment = await prisma.establishment.findUnique({
      where: {
        id: responseBody.establishmentId,
      },
    });

    expect(createdUser).not.toBeNull();
    expect(createdUser?.role).toBe("ESTABLISHMENT");
    expect(createdEstablishment).not.toBeNull();
    expect(createdEstablishment?.slug).toBe("valid-establishment");
  });

  it("should start each test with a clean database", async () => {
    const response = await request(getHttpServer(app))
      .post("/register/establishment")
      .send(makeRegisterEstablishmentPayload());

    expect(response.status).toBe(201);
  });
});
