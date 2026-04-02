import { Customer } from "../../domain/customer/entities/customer";

export abstract class CustomersRepository {
  abstract create(customer: Customer): Promise<void>;
  abstract findByCpf(cpf: string): Promise<Customer | null>;
  abstract findById(id: string): Promise<Customer | null>;
}
