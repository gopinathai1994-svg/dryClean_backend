import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { UpdateEmailDto, UpdatePasswordDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.getOrCreateAdmin();
    console.log(`Admin user: ${JSON.stringify(admin)}`);
    // how to passwordhash decrypt in nodejs
    const decodedPasswordHash = bcrypt.hashSync(admin.passwordHash, 10);
    console.log(decodedPasswordHash, 'decodedPasswordHash');
    const passwordMatches = await bcrypt.compare(dto.password, admin.passwordHash);
console.log(`Login attempt for email: ${dto.email}, password: ${dto.password}`);
console.log('passwordMatches',passwordMatches)
    if (dto.email.trim().toLowerCase() !== admin.email || !passwordMatches) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    return this.authResponse(admin);
  }

  async profile() {
    const admin = await this.getOrCreateAdmin();
    return this.publicAdmin(admin);
  }

  async updateEmail(dto: UpdateEmailDto) {
    const admin = await this.getOrCreateAdmin();
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userModel.findOne({ email, _id: { $ne: admin._id } }).exec();

    if (existing) {
      throw new ConflictException('Email is already in use');
    }

    admin.email = email;
    await admin.save();
    return this.authResponse(admin);
  }

  async updatePassword(dto: UpdatePasswordDto) {
    const admin = await this.getOrCreateAdmin();

    if (dto.currentPassword) {
      const passwordMatches = await bcrypt.compare(dto.currentPassword, admin.passwordHash);
      if (!passwordMatches) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    admin.passwordHash = await bcrypt.hash(dto.password, 10);
    await admin.save();
    return this.publicAdmin(admin);
  }

  private async getOrCreateAdmin(): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ role: 'admin' }).exec();

    if (existing) {
      // console.log(`Found existing admin user: ${JSON.stringify(existing)}`);
      return existing;
    }

    const email = (this.config.get<string>('ADMIN_EMAIL') || 'admin@tl.com').trim().toLowerCase();
    const password = this.config.get<string>('ADMIN_PASSWORD') || 'admin123';
    const configuredHash = this.config.get<string>('ADMIN_PASSWORD_HASH');
    const passwordHash = configuredHash || (await bcrypt.hash(password, 10));
    console.log(`Creating default admin user with email: ${email}, passwordHash: ${passwordHash}`);

    return this.userModel.create({ email, passwordHash, role: 'admin' });
  }

  private authResponse(admin: UserDocument) {
    return {
      token: this.jwt.sign({ email: admin.email, role: admin.role || 'admin' }),
      admin: this.publicAdmin(admin),
    };
  }

  private publicAdmin(admin: UserDocument) {
    return { email: admin.email, role: admin.role || 'admin' };
  }
}
