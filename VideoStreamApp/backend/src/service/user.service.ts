import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../model/user.schema';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
  async signup(user: User): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(user.password, salt);
    const reqBody = {
      ...user,
      password: hash,
    };
    const newUser = new this.userModel(reqBody);
    return newUser.save();
  }

  async signin(user: User, jwt: JwtService): Promise<any> {
    const foundUser = await this.userModel
      .findOne({ email: user.email })
      .exec();
    if (!foundUser) {
      return new HttpException(
        'Incorrect username or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const { password } = foundUser;
    const isCorrectPass = bcrypt.compare(user.password, password);
    if (!isCorrectPass) {
      return new HttpException(
        'Incorrect username or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const payload = { email: user.email };
    return {
      token: jwt.sign(payload),
    };
  }

  async getOne(email): Promise<User> {
    return await this.userModel.findOne({ email }).exec();
  }
}
