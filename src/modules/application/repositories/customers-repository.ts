import { Customer } from "../../customer/domain/entities/customer";

export abstract class CustomersRepository {
  abstract create(customer: Customer): Promise<void>;
  abstract findById(id: string): Promise<Customer | null>;
  abstract findByCpf(cpf: string): Promise<Customer | null>;
}
