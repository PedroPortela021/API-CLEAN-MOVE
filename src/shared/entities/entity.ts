import { UniqueEntityId } from "./unique-entity-id.js";

export abstract class Entity<Props> {
  private _id: UniqueEntityId;
  protected props: Props;

  get id() {
    return this._id;
  }

  constructor(props: Props, id?: UniqueEntityId) {
    this.props = props;
    this._id = id ?? new UniqueEntityId();
  }

  public equals(entity: Entity<unknown>) {
    if (entity === this) {
      return true;
    }

    if (entity.id === this._id) {
      return true;
    }

    return false;
  }
}
