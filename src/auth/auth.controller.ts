import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateEmailDto, UpdatePasswordDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('profile')
  @UseGuards(AdminGuard)
  profile() {
    return this.auth.profile();
  }

  @Patch('profile/email')
  @UseGuards(AdminGuard)
  updateEmail(@Body() dto: UpdateEmailDto) {
    return this.auth.updateEmail(dto);
  }

  @Patch('profile/password')
  @UseGuards(AdminGuard)
  updatePassword(@Body() dto: UpdatePasswordDto) {
    return this.auth.updatePassword(dto);
  }
}
