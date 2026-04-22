import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { EnvService } from "./env/env.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const envService = app.get(EnvService);
  const port = envService.get("PORT");

  app.enableCors({
    origin: envService.get("FRONTEND_URL"),
    credentials: true,
  });

  await app.listen(port, "0.0.0.0");
}

void bootstrap();
