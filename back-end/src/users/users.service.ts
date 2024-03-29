import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SignUpDTO, FinishSignUpDTO } from './dto/SignUp.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async GetUserByToken(token: string) {
    const payload = this.jwt.verify(token.trim());
    let user: any = null;
    try {
      user = await this.prisma.player.findUnique({
        where: { email: payload.email },
      });
    } catch (err) {
    }
    if (!user) {
      throw new HttpException('invalid token', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.player.findUnique({
      where: { email: email },
    });
    // if (!user) return new HttpException('User not found', HttpStatus.NOT_FOUND);
    return user;
  }

  async getUserById(id: number) {
    const user = await this.prisma.player.findUnique({
      where: {
        id_player: id,
      },
    });
    return user;
  }

  async signUp(SignUpDTO: SignUpDTO) {
    const userExists = await this.prisma.player.findUnique({
      where: { email: SignUpDTO.email },
    });
    if (userExists) {
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    }
    const user = await this.prisma.player.create({
      data: SignUpDTO,
    });

    return user;
  }

  async finishSignUp(dto: SignUpDTO) {
    let userExists = await this.prisma.player.findUnique({
      where: { email: dto.email },
    });
    if (userExists.isAuthenticated) {
      throw new HttpException(
        'User already authenticated',
        HttpStatus.CONFLICT,
      );
    }
    userExists = await this.updateProfile({
      email: dto.email,
      username: dto.username,
      avatar: dto.avatar,
      isAuthenticated: true,
    });
    return userExists;
  }

  async updateProfile(FinishSignUpDTO: FinishSignUpDTO) {
    const userExists = await this.prisma.player.findUnique({
      where: { email: FinishSignUpDTO.email },
    });
    if (!userExists) {
      throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    }

    const user = await this.prisma.player.update({
      where: { email: FinishSignUpDTO.email },
      data: FinishSignUpDTO,
    });
    return user;
  }

  async updateUsername(id: number, username: string) {
    const user = await this.prisma.player.findFirst({
      where: { username: username },
    });
    if (!user) {
      const user = await this.prisma.player.update({
        where: { id_player: id },
        data: {
          username: username,
        },
      });
      return user;
    } else {
      throw new HttpException('Username already exists', HttpStatus.CONFLICT);
    }
  }

  async UploadAvatar(id: number, file: Express.Multer.File) {
    const user = await this.prisma.player.update({
      where: { id_player: id },
      data: {
        avatar: `${this.config.get('VITE_REACT_APP_BACKEND_URL')}/` + file.path,
      },
    });
    return user;
  }

  async updateTwoFaSecret(id: number, secret: string) {
    const user = await this.prisma.player.update({
      where: { id_player: id },
      data: {
        twoFASecret: secret,
      },
    });
    return user;
  }

  async updateTwoFaStatus(id: number, status: boolean) {
    const user = await this.prisma.player.update({
      where: { id_player: id },
      data: {
        twofa: status,
      },
    });
    return user;
  }

  async getSecretWithId(id: number) {
    const twofasec = await this.prisma.player.findUnique({
      where: { id_player: id },
      select: { twoFASecret: true },
    });
    return twofasec?.twoFASecret;
  }
}
