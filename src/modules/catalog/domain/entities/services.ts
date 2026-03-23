import { Entity } from "../../../../shared/entities/entity";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Optional } from "../../../../shared/types/optional";
import { ServiceCategory } from "../value-objects/category";

export type ServiceProps = {
  ownerId: UniqueEntityId;
  serviceName: string;
  description: string;
  category: ServiceCategory;
  averageDurationInMinutes: number;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export class Service extends Entity<ServiceProps> {
  get ownerId() {
    return this.props.ownerId;
  }

  get serviceName() {
    return this.props.serviceName;
  }

  get description() {
    return this.props.description;
  }

  get category() {
    return this.props.category;
  }

  get averageDurationInMinutes() {
    return this.props.averageDurationInMinutes;
  }

  get isActive() {
    return this.props.isActive;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(
    props: Optional<ServiceProps, "createdAt" | "updatedAt" | "isActive">,
    id?: UniqueEntityId,
  ) {
    const service = new Service(
      {
        ...props,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );

    return service;
  }
}
