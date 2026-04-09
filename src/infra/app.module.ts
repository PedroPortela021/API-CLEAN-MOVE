import { Module } from "@nestjs/common";

import { DatabaseModule } from "./database/database.module";
import { EnvModule } from "./env/env.module";

@Module({
  imports: [EnvModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
