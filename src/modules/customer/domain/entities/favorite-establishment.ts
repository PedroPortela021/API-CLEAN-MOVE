import { Entity } from "../../../../shared/entities/entity";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Optional } from "../../../../shared/types/optional";

export type FavoriteEstablishmentProps = {
  customerId: UniqueEntityId;
  establishmentId: UniqueEntityId;
  createdAt: Date;
};

export class FavoriteEstablishment extends Entity<FavoriteEstablishmentProps> {
  get customerId() {
    return this.props.customerId;
  }

  get establishmentId() {
    return this.props.establishmentId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  static create(
    props: Optional<FavoriteEstablishmentProps, "createdAt">,
    id?: UniqueEntityId,
  ) {
    const favorite = new FavoriteEstablishment(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return favorite;
  }
}
