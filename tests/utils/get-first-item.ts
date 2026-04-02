export function getFirstItem<T>(items: T[]): T {
  const firstItem = items[0];

  if (!firstItem) {
    throw new Error("Expected at least one item");
  }

  return firstItem;
}
