import { AggregateRoot } from "../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Optional } from "../../../../shared/types/optional";
import { Cnpj } from "../value-objects/cnpj";
import { OperatingHours } from "../value-objects/operating-hours";
import { Slug } from "../value-objects/slug";

export type EstablishmentProps = {
  ownerId: UniqueEntityId;
  corporateName: string;
  socialReason: string;
  slug: Slug;
  operatingHours: OperatingHours;
  cnpj: Cnpj;
};

export class Establishment extends AggregateRoot<EstablishmentProps> {
  get ownerId() {
    return this.props.ownerId;
  }

  get corporateName() {
    return this.props.corporateName;
  }

  get socialReason() {
    return this.props.socialReason;
  }

  get operatingHours() {
    return this.props.operatingHours;
  }

  get cnpj() {
    return this.props.cnpj;
  }

  get slug() {
    return this.props.slug;
  }

  set corporateName(name: string) {
    this.props.corporateName = name;
  }

  static create(
    props: Optional<EstablishmentProps, "slug">,
    id?: UniqueEntityId,
  ) {
    const establishment = new Establishment(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.corporateName),
      },
      id,
    );
    return establishment;
  }
}
