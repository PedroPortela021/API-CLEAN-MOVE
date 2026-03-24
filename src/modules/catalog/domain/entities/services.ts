import { AggregateRoot } from "../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Optional } from "../../../../shared/types/optional";
import { EstimatedDuration } from "../value-objects/estimated-duration";
import { Money } from "../value-objects/money";
import { ServiceCategory } from "../value-objects/service-category";
import { ServiceName } from "../value-objects/service-name";

export type ServiceProps = {
  establishmentId: UniqueEntityId;
  serviceName: ServiceName;
  description: string;
  category: ServiceCategory;
  estimatedDuration: EstimatedDuration;
  price: Money;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export class Service extends AggregateRoot<ServiceProps> {
  get establishmentId() {
    return this.props.establishmentId;
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

  get estimatedDuration() {
    return this.props.estimatedDuration;
  }

  get price() {
    return this.props.price;
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

  update(data: {
    serviceName?: string;
    description?: string;
    category?: ServiceCategory;
    estimatedDuration?: {
      minInMinutes: number;
      maxInMinutes?: number;
    };
    price?: number;
  }) {
    if (data.serviceName !== undefined) {
      this.changeServiceName(data.serviceName);
    }
    if (data.description !== undefined) {
      this.changeDescription(data.description);
    }
    if (data.estimatedDuration !== undefined) {
      this.changeEstimatedDuration(data.estimatedDuration);
    }
    if (data.category !== undefined) {
      this.changeCategory(data.category);
    }
    if (data.price !== undefined) {
      this.changePrice(data.price);
    }
  }

  changeServiceName(serviceName: string) {
    const newServiceName = ServiceName.create(serviceName);

    if (this.serviceName.equals(newServiceName)) return;

    this.props.serviceName = newServiceName;
    this.touch();
  }

  changeDescription(description: string) {
    const normalizedDescription = description.trim();

    if (this.description === normalizedDescription) return;

    this.props.description = normalizedDescription;
    this.touch();
  }

  changeCategory(category: ServiceCategory) {
    if (this.category === category) return;

    this.props.category = category;
    this.touch();
  }

  changeEstimatedDuration(input: {
    minInMinutes: number;
    maxInMinutes?: number;
  }) {
    const newEstimatedDuration = EstimatedDuration.create(input);

    if (this.estimatedDuration.equals(newEstimatedDuration)) return;

    this.props.estimatedDuration = newEstimatedDuration;
    this.touch();
  }

  changePrice(amountInCents: number) {
    const newPrice = Money.create(amountInCents);

    if (this.price.equalsValue(newPrice)) return;

    this.props.price = newPrice;
    this.touch();
  }

  changeIsActive(isActive: boolean) {
    if (this.isActive === isActive) return;

    this.props.isActive = isActive;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
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
