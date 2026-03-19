import { AggregateRoot } from "../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Cnpj } from "../value-objects/cnpj";

export type EstablishmentProps = {
  ownerId: UniqueEntityId;
  corporateName: string;
  socialReason: string;
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

  get cnpj() {
    return this.props.cnpj;
  }

  set corporateName(name: string) {
    this.props.corporateName = name;
  }

  static create(props: EstablishmentProps, id?: UniqueEntityId) {
    const establishment = new Establishment(props, id);
    return establishment;
  }
}
