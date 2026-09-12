import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const updatedUser = await this.usersService.ensureMentorCode(user);
      const { password, hashedRefreshToken, ...result } = updatedUser;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const userEntity = await this.usersService.findOne(user.id);
    const tokenVersion = userEntity?.tokenVersion ?? user.tokenVersion ?? 0;

    const accessPayload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
      mentorCode: user.mentorCode,
      hasSwitchedRole: !!user.hasSwitchedRole,
      tokenVersion,
      tokenType: 'access',
    };

    const refreshPayload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      tokenVersion,
      tokenType: 'refresh',
    };

    const accessExpiresIn = (process.env.JWT_ACCESS_EXPIRES_IN || '7d') as any;
    const access_token = this.jwtService.sign(accessPayload, {
      expiresIn: accessExpiresIn,
    });
    const refresh_token = this.jwtService.sign(refreshPayload, {
      expiresIn: '30d',
    });

    // Hash and store refresh token
    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refresh_token, salt);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mentorCode: user.mentorCode,
        hasSwitchedRole: !!user.hasSwitchedRole,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.usersService.findOneWithRefreshToken(payload.sub);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Session expired');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Issue rotated token pair
    return this.login(user);
  }

  async logout(userId: string) {
    await this.usersService.revokeAllUserSessions(userId);
    return { success: true, message: 'Logged out successfully' };
  }

  async register(registerDto: RegisterDto | CreateUserDto) {
    const role = registerDto.role || UserRole.STUDENT;
    const user = await this.usersService.create({
      ...registerDto,
      role: role as UserRole,
    });
    // Auto-login after register
    return this.login(user);
  }
}
