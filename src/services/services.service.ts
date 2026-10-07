import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceItem } from './schemas/service-item.schema';

const defaultServices = [
  { name: 'Wash & Fold', description: 'Everyday laundry cleaned, dried, and folded with care.', icon: 'local_laundry_service' },
  { name: 'Dry Cleaning', description: 'Premium garment care for suits, sarees, coats, and dresses.', icon: 'dry_cleaning' },
  { name: 'Steam Ironing', description: 'Crisp finishing for office wear, uniforms, and occasion outfits.', icon: 'iron' },
];

@Injectable()
export class ServicesService {
  constructor(@InjectModel(ServiceItem.name) private readonly serviceModel: Model<ServiceItem>) {}

  async create(dto: CreateServiceDto) {
    return this.serviceModel.create(dto);
  }

  async findAll() {
    const items = await this.serviceModel.find({ active: true }).sort({ name: 1 }).lean();
    return items.length ? items : defaultServices;
  }

  findAllAdmin() {
    return this.serviceModel.find().sort({ updatedAt: -1 }).lean();
  }

  async update(id: string, dto: UpdateServiceDto) {
    const service = await this.serviceModel.findByIdAndUpdate(id, dto, { new: true }).lean();
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async remove(id: string) {
    const result = await this.serviceModel.findByIdAndDelete(id).lean();
    if (!result) {
      throw new NotFoundException('Service not found');
    }
    return { deleted: true };
  }
}
