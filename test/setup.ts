import "reflect-metadata";

import { afterEach } from "vitest";

import { DomainEvents } from "../src/shared/events/domain-events";

afterEach(() => {
  DomainEvents.clearHandlers();
  DomainEvents.clearMarkedAggregates();
});
