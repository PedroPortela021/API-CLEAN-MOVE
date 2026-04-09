import {
  BadRequestException,
  HttpStatus,
  Injectable,
  type ArgumentMetadata,
  type PipeTransform,
} from "@nestjs/common";
import { z } from "zod";

export type ZodValidationIssue = {
  code: string;
  message: string;
  path: string;
};

export function formatZodValidationIssues(
  error: z.ZodError,
): ZodValidationIssue[] {
  return error.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path.join("."),
  }));
}

@Injectable()
export class ZodValidationPipe<TSchema extends z.ZodTypeAny>
  implements PipeTransform<unknown, z.output<TSchema>>
{
  constructor(private readonly schema: TSchema) {}

  transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): z.output<TSchema> {
    const result = this.schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    throw new BadRequestException({
      error: "Bad Request",
      issues: formatZodValidationIssues(result.error),
      message: "Validation failed",
      parameter: metadata.data ?? null,
      statusCode: HttpStatus.BAD_REQUEST,
      target: metadata.type,
    });
  }
}
