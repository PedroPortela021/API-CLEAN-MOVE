import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

import {
  ZodValidationPipe,
  formatZodValidationIssues,
} from "./zod-validation.pipe";

describe("ZodValidationPipe", () => {
  it("should return parsed data when payload is valid", () => {
    const pipe = new ZodValidationPipe(
      z.object({
        page: z.coerce.number().int().min(1),
        search: z.string().trim().min(1),
      }),
    );

    const result = pipe.transform(
      {
        page: "2",
        search: " lavagem ",
      },
      {
        data: undefined,
        metatype: Object,
        type: "query",
      },
    );

    expect(result).toEqual({
      page: 2,
      search: "lavagem",
    });
  });

  it("should throw BadRequestException with formatted issues when payload is invalid", () => {
    const pipe = new ZodValidationPipe(
      z.object({
        email: z.email(),
        password: z.string().min(6),
      }),
    );

    expect(() =>
      pipe.transform(
        {
          email: "invalid-email",
          password: "123",
        },
        {
          data: undefined,
          metatype: Object,
          type: "body",
        },
      ),
    ).toThrowError(BadRequestException);

    try {
      pipe.transform(
        {
          email: "invalid-email",
          password: "123",
        },
        {
          data: undefined,
          metatype: Object,
          type: "body",
        },
      );
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);

      const response = (error as BadRequestException).getResponse();

      expect(response).toEqual({
        error: "Bad Request",
        issues: [
          {
            code: "invalid_format",
            message: "Invalid email address",
            path: "email",
          },
          {
            code: "too_small",
            message: "Too small: expected string to have >=6 characters",
            path: "password",
          },
        ],
        message: "Validation failed",
        parameter: null,
        statusCode: 400,
        target: "body",
      });
    }
  });

  it("should format nested issue paths", () => {
    const schema = z.object({
      customer: z.object({
        phone: z.string().min(10),
      }),
    });

    const result = schema.safeParse({
      customer: {
        phone: "123",
      },
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected schema parsing to fail");
    }

    expect(formatZodValidationIssues(result.error)).toEqual([
      {
        code: "too_small",
        message: "Too small: expected string to have >=10 characters",
        path: "customer.phone",
      },
    ]);
  });
});
