import { Injectable } from "@nestjs/common";

import { CustomersRepository } from "../../../../modules/application/repositories/customers-repository";
import { Customer } from "../../../../modules/customer/domain/entities/customer";
import { PrismaCustomerMapper } from "../mappers/prisma-customer-mapper";
import { rethrowPrismaRepositoryError } from "../prisma-repository-error-handler";
import { PrismaUnitOfWork } from "../prisma-unit-of-work";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaCustomersRepository implements CustomersRepository {
  constructor(private prisma: PrismaService) {}

  async create(customer: Customer): Promise<void> {
    const data = PrismaCustomerMapper.toPrisma(customer);

    try {
      await PrismaUnitOfWork.getClient(this.prisma).customer.create({
        data,
      });
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findByCpf(cpf: string): Promise<Customer | null> {
    try {
      const customer = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).customer.findUnique({
        where: {
          cpf,
        },
      });

      if (!customer) {
        return null;
      }

      return PrismaCustomerMapper.toDomain(customer);
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }

  async findById(id: string): Promise<Customer | null> {
    try {
      const customer = await PrismaUnitOfWork.getClient(
        this.prisma,
      ).customer.findUnique({
        where: {
          id,
        },
      });

      if (!customer) {
        return null;
      }

      return PrismaCustomerMapper.toDomain(customer);
    } catch (error) {
      rethrowPrismaRepositoryError(error);
    }
  }
}
