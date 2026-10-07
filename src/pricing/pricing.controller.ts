import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get()
  findPublic() {
    return this.pricing.findPublic();
  }

  @UseGuards(AdminGuard)
  @Get('admin')
  findAdmin() {
    return this.pricing.findAdmin();
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: CreatePricingDto) {
    return this.pricing.create(dto);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePricingDto) {
    return this.pricing.update(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pricing.remove(id);
  }
}
