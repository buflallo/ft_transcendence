import {
  Controller,
  Get,
  Req,
  HttpException,
  HttpStatus,
  SetMetadata,
  Res,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFilename } from './AvatarTools';
import { imageFileFilter } from './AvatarTools';
import { UpdateUsernameDTO } from './dto/SignUp.dto';

@Controller('user')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private Config: ConfigService,
  ) {}

  @SetMetadata('isPublic', true)
  @Get()
  async GetProfileData(@Req() req: Request) {
    try 
    {
      if (req.cookies['TWOFA']) {
        return { twoFA: true };
      }
      if (req.cookies['JWT_TOKEN']) {
        const user = await this.usersService.GetUserByToken(
          req.cookies['JWT_TOKEN'],
        );
        return user;
      } else if (req.cookies['USER']) {
        const user = await this.usersService.GetUserByToken(req.cookies['USER']);
        return user;
      } else return { msg: 'no cookies' };
    }
    catch
    {
      return { msg: 'wrong cookie' };
    }
  }

  @SetMetadata('isPublic', true)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './avatars',
        filename: editFilename,
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: 1024 * 1024 * 5 },
    }),
  )
  async addAvatar(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const user = await this.usersService.GetUserByToken(
      request.cookies['JWT_TOKEN'] || request.cookies['USER'],
    );
    await this.usersService.UploadAvatar(user.id_player, file);
    // if upload is successful
    if (file) {
      return `${this.Config.get('VITE_REACT_APP_BACKEND_URL')}/` + file.path;
    }
    return 'madazsh';
  }

  @Post('updateUsername')
  async updateUsername(@Req() req: Request, @Body() dto: UpdateUsernameDTO) {
    const user = await this.usersService.GetUserByToken(
      req.cookies['JWT_TOKEN'] || req.cookies['USER'],
    );
    const newUser = await this.usersService.updateUsername(
      user.id_player,
      dto.username,
    );
    return { user: newUser };
  }

  // @Get('/:id')
  // async getUserById(@Param() { id }: { id: string }) {
  //   const user = await this.usersService.getUserById(Number(id));
  //   return user;
  // }

  @Get('/logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (req.cookies['JWT_TOKEN']) {
      res.cookie('JWT_TOKEN', '', { expires: new Date() });
      res.redirect(`${this.Config.get('FRONTEND_URL')}/`);
      // return "Logge/d out";
    } else if (req.cookies['USER']) {
      res.cookie('USER', '', { expires: new Date() });
      res.redirect(`${this.Config.get('FRONTEND_URL')}/`);
      // return "Logged out";
    } else throw new HttpException('No Cookies', HttpStatus.UNAUTHORIZED);
  }
}
