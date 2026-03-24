import { CustomersRepository } from "../../modules/application/repositories/customers-repository";
import { Customer } from "../../modules/customer/domain/entities/customer";

export class InMemoryCustomersRepository implements CustomersRepository {
  public items: Customer[] = [];

  async create(customer: Customer): Promise<void> {
    this.items.push(customer);
  }

  async findByCpf(cpf: string): Promise<Customer | null> {
    const customer = this.items.find((item) => item.cpf.toString() === cpf);

    if (!customer) {
      return null;
    }

    return customer;
  }
}
