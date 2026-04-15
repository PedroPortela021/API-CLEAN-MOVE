import { configureE2EEnv } from "./env";
import { resetTestDatabase } from "./database";

type GlobalSetupProject = {
  onTestsRerun(callback: () => Promise<void>): void;
};

export default async function setup(
  project: GlobalSetupProject,
): Promise<void> {
  configureE2EEnv();
  await resetTestDatabase();

  project.onTestsRerun(async () => {
    await resetTestDatabase();
  });
}
