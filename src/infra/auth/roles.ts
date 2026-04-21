import { Reflector } from "@nestjs/core";
import { UserRole } from "../../modules/accounts/domain/value-objects/user-role";

export const Roles = Reflector.createDecorator<UserRole[]>();
