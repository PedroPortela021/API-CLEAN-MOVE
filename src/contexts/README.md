# Context Map

This project is organized around two bounded contexts:

- `booking-operations`
  - Core subdomain: `scheduling`
  - Supporting subdomains: `catalog`, `customer`, `establishments`
- `identity-access`
  - Accounts, credentials, and profile management

Folder convention:

- `contexts/<bounded-context>/domain/<subdomain>`
- `contexts/<bounded-context>/application/...`

Practical rules for this codebase:

- Domain code stays inside its context.
- Cross-context relationships should happen through IDs, snapshots, or application-layer orchestration.
- `booking-operations` may depend on `identity-access` in application use cases such as registration, but not by collapsing both models into a single module again.
