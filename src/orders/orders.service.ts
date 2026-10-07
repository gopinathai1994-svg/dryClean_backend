import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomersService } from '../customers/customers.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly customers: CustomersService,
  ) {}

  async create(dto: CreateOrderDto) {
    await this.customers.upsertFromOrder(dto);
    return this.orderModel.create(dto);
  }

  findAll() {
    return this.orderModel.find().sort({ createdAt: -1 }).lean();
  }

  async findOne(id: string) {
    const order = await this.orderModel.findById(id).lean();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findByMobile(mobile: string) {
    return this.orderModel.find({ mobile }).sort({ createdAt: -1 }).lean();
  }

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.orderModel.findByIdAndUpdate(id, dto, { new: true }).lean();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async remove(id: string) {
    const result = await this.orderModel.findByIdAndDelete(id).lean();
    if (!result) {
      throw new NotFoundException('Order not found');
    }
    return { deleted: true };
  }

  get model() {
    return this.orderModel;
  }
}
