import { expect, test } from "vitest";
import { Slug } from "./slug.js";

test("it should be able to create a new slug from text", () => {
  const slug = Slug.createFromText("Example Corporate Name ");

  expect(slug.value).toEqual("example-corporate-name");
});
