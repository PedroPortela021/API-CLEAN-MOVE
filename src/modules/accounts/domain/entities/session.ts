import { AggregateRoot } from "../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Optional } from "../../../../shared/types/optional";

export type SessionProps = {
  userId: UniqueEntityId;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  userAgent: string | null;
  ipAddress: string | null;
};

export class Session extends AggregateRoot<SessionProps> {
  get userId() {
    return this.props.userId;
  }

  get refreshTokenHash() {
    return this.props.refreshTokenHash;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get revokedAt() {
    return this.props.revokedAt;
  }

  get lastUsedAt() {
    return this.props.lastUsedAt;
  }

  get userAgent() {
    return this.props.userAgent;
  }

  get ipAddress() {
    return this.props.ipAddress;
  }

  revoke(referenceDate: Date = new Date()) {
    if (this.isRevoked()) {
      return;
    }

    this.props.revokedAt = referenceDate;
    this.touch(referenceDate);
  }

  markAsUsed(referenceDate: Date = new Date()) {
    this.props.lastUsedAt = referenceDate;
    this.touch(referenceDate);
  }

  rotateToken(
    refreshTokenHash: string,
    expiresAt: Date,
    referenceDate: Date = new Date(),
  ) {
    this.props.refreshTokenHash = refreshTokenHash;
    this.props.expiresAt = expiresAt;
    this.props.lastUsedAt = referenceDate;
    this.touch(referenceDate);
  }

  isRevoked() {
    return this.props.revokedAt !== null;
  }

  isExpired(referenceDate: Date = new Date()) {
    return referenceDate.getTime() >= this.props.expiresAt.getTime();
  }

  private touch(referenceDate: Date = new Date()) {
    this.props.updatedAt = referenceDate;
  }

  static create(
    props: Optional<
      SessionProps,
      | "createdAt"
      | "updatedAt"
      | "revokedAt"
      | "lastUsedAt"
      | "userAgent"
      | "ipAddress"
    >,
    id?: UniqueEntityId,
  ) {
    const session = new Session(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        revokedAt: props.revokedAt ?? null,
        lastUsedAt: props.lastUsedAt ?? null,
        userAgent: props.userAgent ?? null,
        ipAddress: props.ipAddress ?? null,
      },
      id,
    );

    return session;
  }
}
