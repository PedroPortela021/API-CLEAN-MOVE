export class ResourceNotFoundError extends Error {
  constructor({
    message,
    resource,
  }: Partial<{ message: string; resource: string }>) {
    super(
      message ??
        `Resource not found${resource ? ": ".concat(`${resource}.`) : "."}`,
    );
  }
}
