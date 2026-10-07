import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../orders/order-status.enum';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class DashboardService {
  constructor(private readonly orders: OrdersService) {}

  async summary() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const model = this.orders.model;

    const [
      totalOrdersCount,
      todayOrdersCount,
      pendingOrdersCount,
      deliveredOrdersCount,
      todayIncomeAgg,
      monthlyIncomeAgg,
    ] =
      await Promise.all([
        model.countDocuments({}),
        model.countDocuments({ createdAt: { $gte: todayStart, $lt: tomorrow } }),
        model.countDocuments({ status: { $nin: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] } }),
        model.countDocuments({ status: OrderStatus.DELIVERED }),
        model.aggregate([
          { $match: { status: OrderStatus.DELIVERED, updatedAt: { $gte: todayStart, $lt: tomorrow } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        model.aggregate([
          { $match: { status: OrderStatus.DELIVERED, updatedAt: { $gte: monthStart } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
      ]);

    return {
      totalOrdersCount,
      todayOrdersCount,
      pendingOrdersCount,
      deliveredOrdersCount,
      todayIncome: todayIncomeAgg[0]?.total || 0,
      monthlyIncome: monthlyIncomeAgg[0]?.total || 0,
    };
  }
}
