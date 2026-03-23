export class ResourceNotFoundError extends Error {
  constructor(message?: string, resource?: string) {
    super(message ?? `Resource not found ${resource && ": ".concat(resource)}`);
  }
}
