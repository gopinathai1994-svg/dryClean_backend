import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { Pricing } from './schemas/pricing.schema';

const managedPricing = [
  { item: 'Shirt', serviceType: 'Dry Cleaning', price: 60 },
  { item: 'Pant', serviceType: 'Dry Cleaning', price: 80 },
  { item: 'T-Shirt', serviceType: 'Dry Cleaning', price: 50 },
  { item: 'Jeans', serviceType: 'Dry Cleaning', price: 90 },
  { item: 'Blouse', serviceType: 'Dry Cleaning', price: 50 },
  { item: 'Saree', serviceType: 'Dry Cleaning', price: 200 },
  { item: 'Silk Saree', serviceType: 'Dry Cleaning', price: 250 },
  { item: 'Cotton Saree', serviceType: 'Dry Cleaning', price: 180 },
  { item: 'Designer Saree', serviceType: 'Dry Cleaning', price: 350 },
  { item: 'Wedding Saree', serviceType: 'Dry Cleaning', price: 500 },
  { item: 'Lehenga', serviceType: 'Dry Cleaning', price: 350 },
  { item: 'Bridal Lehenga', serviceType: 'Dry Cleaning', price: 600 },
  { item: 'Reception Gown', serviceType: 'Dry Cleaning', price: 300 },
  { item: 'Wedding Gown', serviceType: 'Dry Cleaning', price: 500 },
  { item: 'Normal Veshti', serviceType: 'Dry Cleaning', price: 100 },
  { item: 'Pattu Veshti', serviceType: 'Dry Cleaning', price: 150 },
  { item: 'Kurta', serviceType: 'Dry Cleaning', price: 100 },
  { item: 'Salwar', serviceType: 'Dry Cleaning', price: 120 },
  { item: 'Salwar Suit', serviceType: 'Dry Cleaning', price: 120 },
  { item: 'Churidar', serviceType: 'Dry Cleaning', price: 100 },
  { item: 'Dupatta', serviceType: 'Dry Cleaning', price: 60 },
  { item: 'Sherwani', serviceType: 'Dry Cleaning', price: 450 },
  { item: 'Blazer', serviceType: 'Dry Cleaning', price: 250 },
  { item: 'Coat', serviceType: 'Dry Cleaning', price: 300 },
  { item: 'Suit (2 Piece)', serviceType: 'Dry Cleaning', price: 450 },
  { item: 'Suit (3 Piece)', serviceType: 'Dry Cleaning', price: 550 },
  { item: 'Jacket', serviceType: 'Dry Cleaning', price: 220 },
  { item: 'Sweater', serviceType: 'Dry Cleaning', price: 180 },
  { item: 'Hoodie', serviceType: 'Dry Cleaning', price: 180 },
  { item: 'Kids Dress', serviceType: 'Dry Cleaning', price: 80 },
  { item: 'School Uniform', serviceType: 'Dry Cleaning', price: 120 },
  { item: 'Blanket', serviceType: 'Dry Cleaning', price: 300 },
  { item: 'Bed Sheet', serviceType: 'Dry Cleaning', price: 180 },
  { item: 'Curtain', serviceType: 'Dry Cleaning', price: 250 },
  { item: 'Pillow Cover', serviceType: 'Dry Cleaning', price: 40 },
  { item: 'Cushion Cover', serviceType: 'Dry Cleaning', price: 50 },
  { item: 'Sofa Cover', serviceType: 'Dry Cleaning', price: 350 },
  { item: 'Table Cloth', serviceType: 'Dry Cleaning', price: 100 },
  { item: 'Soft Toy', serviceType: 'Dry Cleaning', price: 250 },
  { item: 'Dress', serviceType: 'Dry Cleaning', price: 180 },
  { item: 'Skirt', serviceType: 'Dry Cleaning', price: 120 },
  { item: 'Tie', serviceType: 'Dry Cleaning', price: 80 },
  { item: 'Waistcoat', serviceType: 'Dry Cleaning', price: 180 },
  { item: 'Shawl / Stole', serviceType: 'Dry Cleaning', price: 120 },
  { item: 'Quilt', serviceType: 'Dry Cleaning', price: 350 },
  { item: 'Duvet', serviceType: 'Dry Cleaning', price: 400 },
  { item: 'Carpet', serviceType: 'Dry Cleaning', price: 600 },
  { item: 'Rug', serviceType: 'Dry Cleaning', price: 450 },
  { item: 'Shoes', serviceType: 'Dry Cleaning', price: 350 },

  { item: 'Shirt', serviceType: 'Wash & Fold', price: 35 },
  { item: 'Pant', serviceType: 'Wash & Fold', price: 40 },
  { item: 'T-Shirt', serviceType: 'Wash & Fold', price: 30 },
  { item: 'Jeans', serviceType: 'Wash & Fold', price: 45 },
  { item: 'Kurta', serviceType: 'Wash & Fold', price: 50 },
  { item: 'Salwar', serviceType: 'Wash & Fold', price: 60 },
  { item: 'Saree', serviceType: 'Wash & Fold', price: 120 },
  { item: 'Cotton Saree', serviceType: 'Wash & Fold', price: 100 },
  { item: 'Blouse', serviceType: 'Wash & Fold', price: 30 },
  { item: 'Lehenga', serviceType: 'Wash & Fold', price: 180 },
  { item: 'Reception Gown', serviceType: 'Wash & Fold', price: 200 },
  { item: 'Normal Veshti', serviceType: 'Wash & Fold', price: 40 },
  { item: 'Pattu Veshti', serviceType: 'Wash & Fold', price: 60 },
  { item: 'Bed Sheet', serviceType: 'Wash & Fold', price: 80 },
  { item: 'Blanket', serviceType: 'Wash & Fold', price: 150 },
  { item: 'Pillow Cover', serviceType: 'Wash & Fold', price: 20 },
  { item: 'Curtain', serviceType: 'Wash & Fold', price: 120 },
  { item: 'Shorts', serviceType: 'Wash & Fold', price: 30 },
  { item: 'Night Suit', serviceType: 'Wash & Fold', price: 70 },
  { item: 'Dress', serviceType: 'Wash & Fold', price: 80 },
  { item: 'Skirt', serviceType: 'Wash & Fold', price: 45 },
  { item: 'Towel', serviceType: 'Wash & Fold', price: 35 },
  { item: 'Bath Towel', serviceType: 'Wash & Fold', price: 50 },
  { item: 'Cushion Cover', serviceType: 'Wash & Fold', price: 30 },
  { item: 'Table Cloth', serviceType: 'Wash & Fold', price: 60 },
  { item: 'Quilt', serviceType: 'Wash & Fold', price: 180 },
  { item: 'Duvet', serviceType: 'Wash & Fold', price: 220 },

  { item: 'Shirt', serviceType: 'Wash & Iron', price: 50 },
  { item: 'Pant', serviceType: 'Wash & Iron', price: 60 },
  { item: 'T-Shirt', serviceType: 'Wash & Iron', price: 40 },
  { item: 'Jeans', serviceType: 'Wash & Iron', price: 60 },
  { item: 'Kurta', serviceType: 'Wash & Iron', price: 70 },
  { item: 'Salwar', serviceType: 'Wash & Iron', price: 80 },
  { item: 'Blouse', serviceType: 'Wash & Iron', price: 40 },
  { item: 'Saree', serviceType: 'Wash & Iron', price: 150 },
  { item: 'Cotton Saree', serviceType: 'Wash & Iron', price: 130 },
  { item: 'Silk Saree', serviceType: 'Wash & Iron', price: 200 },
  { item: 'Lehenga', serviceType: 'Wash & Iron', price: 250 },
  { item: 'Reception Gown', serviceType: 'Wash & Iron', price: 250 },
  { item: 'Normal Veshti', serviceType: 'Wash & Iron', price: 60 },
  { item: 'Pattu Veshti', serviceType: 'Wash & Iron', price: 80 },
  { item: 'Bed Sheet', serviceType: 'Wash & Iron', price: 120 },
  { item: 'Blanket', serviceType: 'Wash & Iron', price: 220 },
  { item: 'Curtain', serviceType: 'Wash & Iron', price: 180 },
  { item: 'Shorts', serviceType: 'Wash & Iron', price: 45 },
  { item: 'Night Suit', serviceType: 'Wash & Iron', price: 90 },
  { item: 'Dress', serviceType: 'Wash & Iron', price: 110 },
  { item: 'Skirt', serviceType: 'Wash & Iron', price: 65 },
  { item: 'Dupatta', serviceType: 'Wash & Iron', price: 50 },
  { item: 'School Uniform', serviceType: 'Wash & Iron', price: 100 },
  { item: 'Pillow Cover', serviceType: 'Wash & Iron', price: 30 },
  { item: 'Table Cloth', serviceType: 'Wash & Iron', price: 90 },
  { item: 'Quilt', serviceType: 'Wash & Iron', price: 260 },
  { item: 'Duvet', serviceType: 'Wash & Iron', price: 280 },

  { item: 'Shirt', serviceType: 'Steam Ironing', price: 10 },
  { item: 'Pant', serviceType: 'Steam Ironing', price: 10 },
  { item: 'T-Shirt', serviceType: 'Steam Ironing', price: 15 },
  { item: 'Jeans', serviceType: 'Steam Ironing', price: 30 },
  { item: 'Kurta', serviceType: 'Steam Ironing', price: 30 },
  { item: 'Blouse', serviceType: 'Steam Ironing', price: 20 },
  { item: 'Salwar', serviceType: 'Steam Ironing', price: 35 },
  { item: 'Saree', serviceType: 'Steam Ironing', price: 80 },
  { item: 'Cotton Saree', serviceType: 'Steam Ironing', price: 70 },
  { item: 'Silk Saree', serviceType: 'Steam Ironing', price: 100 },
  { item: 'Lehenga', serviceType: 'Steam Ironing', price: 150 },
  { item: 'Reception Gown', serviceType: 'Steam Ironing', price: 180 },
  { item: 'Normal Veshti', serviceType: 'Steam Ironing', price: 30 },
  { item: 'Pattu Veshti', serviceType: 'Steam Ironing', price: 50 },
  { item: 'Coat', serviceType: 'Steam Ironing', price: 80 },
  { item: 'Blazer', serviceType: 'Steam Ironing', price: 70 },
  { item: 'Sherwani', serviceType: 'Steam Ironing', price: 120 },
  { item: 'Jacket', serviceType: 'Steam Ironing', price: 60 },
  { item: 'Bed Sheet', serviceType: 'Steam Ironing', price: 50 },
  { item: 'Curtain', serviceType: 'Steam Ironing', price: 80 },
  { item: 'Dupatta', serviceType: 'Steam Ironing', price: 30 },
  { item: 'School Uniform', serviceType: 'Steam Ironing', price: 50 },
  { item: 'Dress', serviceType: 'Steam Ironing', price: 70 },
  { item: 'Skirt', serviceType: 'Steam Ironing', price: 40 },
  { item: 'Suit (2 Piece)', serviceType: 'Steam Ironing', price: 150 },
  { item: 'Suit (3 Piece)', serviceType: 'Steam Ironing', price: 200 },
  { item: 'Pillow Cover', serviceType: 'Steam Ironing', price: 20 },
  { item: 'Table Cloth', serviceType: 'Steam Ironing', price: 40 },
];

@Injectable()
export class PricingService implements OnModuleInit {
  constructor(@InjectModel(Pricing.name) private readonly pricingModel: Model<Pricing>) {}

  async onModuleInit() {
    await Promise.all(
      managedPricing.map((item) =>
        this.pricingModel.updateOne(
          { item: item.item, serviceType: item.serviceType },
          { $setOnInsert: { ...item, active: true } },
          { upsert: true },
        ),
      ),
    );
  }

  create(dto: CreatePricingDto) {
    return this.pricingModel.create(dto);
  }

  async findPublic() {
    const items = await this.pricingModel.find({ active: true }).sort({ serviceType: 1, item: 1 }).lean();
    return items.length ? items : managedPricing.map((item) => ({ ...item, active: true }));
  }

  findAdmin() {
    return this.pricingModel.find().sort({ updatedAt: -1 }).lean();
  }

  async update(id: string, dto: UpdatePricingDto) {
    const item = await this.pricingModel.findByIdAndUpdate(id, dto, { new: true }).lean();
    if (!item) {
      throw new NotFoundException('Pricing item not found');
    }
    return item;
  }

  async remove(id: string) {
    const result = await this.pricingModel.findByIdAndDelete(id).lean();
    if (!result) {
      throw new NotFoundException('Pricing item not found');
    }
    return { deleted: true };
  }
}
