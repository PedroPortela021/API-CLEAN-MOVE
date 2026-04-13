import { afterAll, afterEach } from "vitest";

import { registerCommonTestHooks } from "../common-test-hooks";
import { disconnectTestDatabase, truncateAllTables } from "./database";
import { configureE2EEnv } from "./env";

configureE2EEnv();
registerCommonTestHooks();

afterEach(async () => {
  await truncateAllTables();
});

afterAll(async () => {
  await disconnectTestDatabase();
});
