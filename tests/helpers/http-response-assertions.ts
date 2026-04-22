import { expect } from "vitest";
import z from "zod";

const singleMessageResponseSchema = z.looseObject({
  message: z.string(),
});

export function expectSingleMessageResponseWithoutIssues(
  body: unknown,
  expectedMessage: string,
) {
  const parsedBody = singleMessageResponseSchema.parse(body);

  expect(parsedBody.message).toBe(expectedMessage);
  expect(parsedBody).not.toHaveProperty("issues");
}
