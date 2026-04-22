import { INestApplication } from "@nestjs/common";

import { CustomerFactory, makeCustomer } from "../factories/customer-factory";
import {
  EstablishmentFactory,
  makeEstablishment,
} from "../factories/establishment-factory";
import { makeService, ServiceFactory } from "../factories/service-factory";
import { UserFactory } from "../factories/user-factory";
import { PrismaService } from "../../src/infra/database/prisma/prisma.service";
import { loginUser } from "./auth-session.e2e-helpers";

export type BookingContext = {
  establishmentUser: Awaited<ReturnType<UserFactory["makePrismaUser"]>>["user"];
  establishmentPassword: string;
  customerUser: Awaited<ReturnType<UserFactory["makePrismaUser"]>>["user"];
  customerPassword: string;
  establishment: ReturnType<typeof makeEstablishment>;
  customer: ReturnType<typeof makeCustomer>;
  service: ReturnType<typeof makeService>;
};

type ArrangeBookingContextDependencies = {
  userFactory: UserFactory;
  customerFactory: CustomerFactory;
  establishmentFactory: EstablishmentFactory;
  serviceFactory: ServiceFactory;
};

export async function arrangeBookingContext({
  userFactory,
  customerFactory,
  establishmentFactory,
  serviceFactory,
}: ArrangeBookingContextDependencies): Promise<BookingContext> {
  const { user: establishmentUser, plainPassword: establishmentPassword } =
    await userFactory.makePrismaUser({
      role: "ESTABLISHMENT",
      plainPassword: "strong-password",
    });
  const establishment = await establishmentFactory.makePrismaEstablishment({
    ownerId: establishmentUser.id,
  });

  const { user: customerUser, plainPassword: customerPassword } =
    await userFactory.makePrismaUser({
      role: "CUSTOMER",
      plainPassword: "strong-password",
    });
  const customer = await customerFactory.makePrismaCustomer({
    userId: customerUser.id,
  });

  const service = await serviceFactory.makePrismaService({
    establishmentId: establishment.id,
  });

  return {
    establishmentUser,
    establishmentPassword: establishmentPassword ?? "",
    customerUser,
    customerPassword: customerPassword ?? "",
    establishment,
    customer,
    service,
  };
}

export async function loginAsEstablishment({
  app,
  prisma,
  context,
}: {
  app: INestApplication;
  prisma: PrismaService;
  context: BookingContext;
}) {
  return loginUser({
    app,
    prisma,
    userId: context.establishmentUser.id.toString(),
    email: context.establishmentUser.email.toString(),
    password: context.establishmentPassword,
  });
}

export async function loginAsCustomer({
  app,
  prisma,
  context,
}: {
  app: INestApplication;
  prisma: PrismaService;
  context: BookingContext;
}) {
  return loginUser({
    app,
    prisma,
    userId: context.customerUser.id.toString(),
    email: context.customerUser.email.toString(),
    password: context.customerPassword,
  });
}
