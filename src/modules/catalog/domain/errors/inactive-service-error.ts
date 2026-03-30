export class InactiveServiceError extends Error {
  constructor(serviceName?: string) {
    super(`This service is inactive${serviceName ? `: ${serviceName}.` : "."}`);
    this.name = "InactiveServiceError";
  }
}
