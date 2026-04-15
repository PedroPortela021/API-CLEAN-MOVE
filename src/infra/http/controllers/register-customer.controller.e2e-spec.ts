import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import z from "zod";

import { AppModule } from "../../app.module";
import { PrismaService } from "../../database/prisma/prisma.service";

const registerCustomerResponseSchema = z.object({
  customerId: z.uuid(),
});

const validationErrorResponseSchema = z.object({
  statusCode: z.literal(400),
  message: z.literal("Validation failed"),
  error: z.literal("Bad Request"),
  issues: z.array(
    z.object({
      code: z.string(),
      message: z.string(),
      path: z.string(),
    }),
  ),
  parameter: z.null(),
  target: z.literal("body"),
});

function makeRegisterCustomerPayload() {
  return {
    cpf: "529.982.247-25",
    name: "Jon Doe",
    email: "jondoe@example.com",
    password: "jondoe@123",
    phone: "11987654321",
    address: {
      street: "street-1",
      country: "country-1",
      state: "state-1",
      zipCode: "11111-111",
      city: "city-1",
    },
  };
}

function makeAnotherRegisterCustomerPayload() {
  return {
    ...makeRegisterCustomerPayload(),
    cpf: "111.444.777-35",
    name: "Jane Doe",
    phone: "21987654321",
    address: {
      street: "street-2",
      country: "country-2",
      state: "state-2",
      zipCode: "22222-222",
      city: "city-2",
    },
  };
}

function getHttpServer(app: INestApplication): Parameters<typeof request>[0] {
  return app.getHttpServer() as Parameters<typeof request>[0];
}

describe("RegisterCustomerController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("should register a customer and persist the data", async () => {
    const response = await request(getHttpServer(app))
      .post("/register/customer")
      .send(makeRegisterCustomerPayload());

    expect(response.status).toBe(201);

    const responseBody = registerCustomerResponseSchema.parse(response.body);

    expect(responseBody.customerId).toEqual(expect.any(String));

    const createdUser = await prisma.user.findUnique({
      where: {
        email: "jondoe@example.com",
      },
    });

    const createdCustomer = await prisma.customer.findUnique({
      where: {
        id: responseBody.customerId,
      },
    });

    expect(createdUser).not.toBeNull();
    expect(createdUser?.role).toBe("CUSTOMER");
    expect(createdCustomer).not.toBeNull();
    expect(createdCustomer?.cpf).toBe("52998224725");
  });

  it("should return 400 when sending an invalid customer payload", async () => {
    const response = await request(getHttpServer(app))
      .post("/register/customer")
      .send({
        ...makeRegisterCustomerPayload(),
        cpf: "111.111.111-11",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid CPF: 111.111.111-11");

    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.customer.count()).toBe(0);
  });

  it("should return 400 when sending an incomplete customer payload", async () => {
    const incompletePayload = {
      ...makeRegisterCustomerPayload(),
      email: undefined,
    };

    const response = await request(getHttpServer(app))
      .post("/register/customer")
      .send(incompletePayload);

    expect(response.status).toBe(400);

    const responseBody = validationErrorResponseSchema.parse(response.body);

    expect(responseBody.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid_type",
          path: "email",
        }),
      ]),
    );

    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.customer.count()).toBe(0);
  });

  it("should return 409 when trying to register a customer with an email that already exists", async () => {
    const firstResponse = await request(getHttpServer(app))
      .post("/register/customer")
      .send(makeRegisterCustomerPayload());

    expect(firstResponse.status).toBe(201);

    const response = await request(getHttpServer(app))
      .post("/register/customer")
      .send(makeAnotherRegisterCustomerPayload());

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Customer already registered.");

    expect(
      await prisma.user.count({
        where: {
          email: "jondoe@example.com",
        },
      }),
    ).toBe(1);
    expect(await prisma.customer.count()).toBe(1);
    expect(
      await prisma.customer.findUnique({
        where: {
          cpf: "11144477735",
        },
      }),
    ).toBeNull();
  });

  it("should start each test with a clean database", async () => {
    const response = await request(getHttpServer(app))
      .post("/register/customer")
      .send(makeRegisterCustomerPayload());

    expect(response.status).toBe(201);
  });
});
