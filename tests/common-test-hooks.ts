import "reflect-metadata";

import { afterEach } from "vitest";

import { DomainEvents } from "../src/shared/events/domain-events";

export function registerCommonTestHooks(): void {
  afterEach(() => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
  });
}
