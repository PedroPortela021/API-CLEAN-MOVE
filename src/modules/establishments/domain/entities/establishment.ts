import { AggregateRoot } from "../../../../shared/entities/aggregate-root";
import { UniqueEntityId } from "../../../../shared/entities/unique-entity-id";
import { Optional } from "../../../../shared/types/optional";
import { Cnpj } from "../value-objects/cnpj";
import { DayOfWeek, OperatingHours } from "../value-objects/operating-hours";
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

  isOpenDuring(startsAt: Date, endsAt: Date): boolean {
    if (
      startsAt.getFullYear() !== endsAt.getFullYear() ||
      startsAt.getMonth() !== endsAt.getMonth() ||
      startsAt.getDate() !== endsAt.getDate()
    ) {
      return false;
    }

    const dayOfWeekMap: DayOfWeek[] = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];

    const requestedDay = dayOfWeekMap[startsAt.getDay()];
    const requestedStartsAtInMinutes =
      startsAt.getHours() * 60 + startsAt.getMinutes();
    const requestedEndsAtInMinutes =
      endsAt.getHours() * 60 + endsAt.getMinutes();

    return this.operatingHours.days
      .filter((openingDay) => openingDay.day === requestedDay)
      .some((openingDay) =>
        openingDay.ranges.some((range) => {
          const [startHour, startMinute] = range.start.split(":").map(Number);
          const [endHour, endMinute] = range.end.split(":").map(Number);

          if (
            startHour === undefined ||
            startMinute === undefined ||
            endHour === undefined ||
            endMinute === undefined
          ) {
            return false;
          }

          const rangeStartsAtInMinutes = startHour * 60 + startMinute;
          const rangeEndsAtInMinutes = endHour * 60 + endMinute;

          return (
            requestedStartsAtInMinutes >= rangeStartsAtInMinutes &&
            requestedEndsAtInMinutes <= rangeEndsAtInMinutes
          );
        }),
      );
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
