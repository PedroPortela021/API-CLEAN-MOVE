import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { EnvService } from "./env/env.service";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const envService = app.get(EnvService);
  const port = envService.get("PORT");

  app.enableCors({
    origin: envService.get("FRONTEND_URL"),
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("API Clean Move")
    .setDescription("API documentation")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT access token used on protected routes.",
      },
      "access-token",
    )
    .addCookieAuth(
      "refresh_token",
      {
        type: "apiKey",
        in: "cookie",
        description: "HttpOnly refresh token used to renew the session.",
      },
      "refresh-token",
    )
    .addTag("auth", "Authentication and session management")
    .addTag("register", "Customer and establishment registration")
    .addTag("appointment", "Appointment management")
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  await app.listen(port, "0.0.0.0", () =>
    console.log("Swagger: http://localhost:3000/api"),
  );
}

void bootstrap();
