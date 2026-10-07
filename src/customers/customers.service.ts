import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './schemas/customer.schema';

@Injectable()
export class CustomersService {
  constructor(@InjectModel(Customer.name) private readonly customerModel: Model<Customer>) {}

  create(dto: CreateCustomerDto) {
    return this.customerModel.create(dto);
  }

  findAll() {
    return this.customerModel.find().sort({ updatedAt: -1 }).lean();
  }

  async findOne(id: string) {
    const customer = await this.customerModel.findById(id).lean();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.customerModel.findByIdAndUpdate(id, dto, { new: true }).lean();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async remove(id: string) {
    const result = await this.customerModel.findByIdAndDelete(id).lean();
    if (!result) {
      throw new NotFoundException('Customer not found');
    }
    return { deleted: true };
  }

  upsertFromOrder(order: { customerName: string; mobile: string; address: string }) {
    return this.customerModel
      .findOneAndUpdate(
        { mobile: order.mobile },
        {
          $set: { name: order.customerName, mobile: order.mobile, address: order.address },
          $inc: { totalOrders: 1 },
        },
        { new: true, upsert: true },
      )
      .lean();
  }
}
