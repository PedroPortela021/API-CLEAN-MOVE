import { Module } from "@nestjs/common";

import { DatabaseModule } from "./database/database.module";
import { EnvModule } from "./env/env.module";
import { HttpModule } from "./http/http.module";

@Module({
  imports: [EnvModule, DatabaseModule, HttpModule],
  providers: [],
})
export class AppModule {}
