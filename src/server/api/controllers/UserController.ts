import { USER_JWT_TIMEOUT } from '@Config/Passport';
import { Config } from '@Config/index';
import EmailService from '@Services/EmailService';
import EventService from '@Services/EventService';
import UserService from '@Services/UserService';
import { TESCAccount } from '@Shared/ModelTypes';
import { ResetPasswordRequest, ForgotPasswordRequest, RegisterUserRequest, UpdateUserRequest } from '@Shared/api/Requests';
import { JWTUserAuthToken, JWTUserAuth, SuccessResponse } from '@Shared/api/Responses';
import { Response, Request } from 'express-serve-static-core';
import * as jwt from 'jsonwebtoken';
import { Get, JsonController, UseBefore, Res, Post, Req, Body, UploadedFile, BodyParam } from 'routing-controllers';

import { ErrorMessage } from '../../utils/Errors';
import { AuthorisedUser } from '../decorators/AuthorisedUser';
import { UserAuthorisation } from '../middleware/UserAuthorisation';
import { UserLogin } from '../middleware/UserLogin';
import { ValidateEventAlias } from 'api/middleware/ValidateEventAlias';
import Uploads from '@Config/Uploads';
import { SelectedEvent } from 'api/decorators/SelectedEvent';
import { EventDocument } from '@Models/Event';
import { UserDocument } from '@Models/User';

@JsonController('/user')
export class UserController {
  constructor(
    private EmailService: EmailService,
    private EventService: EventService,
    private UserService: UserService
  ) {}

  /**
   * Signs a user with the JWT secret.
   * @param user The public user information to sign.
   * @returns The JWT token signed for that user.
   */
  generateToken(user: JWTUserAuthToken) {
    return jwt.sign(user, Config.SessionSecret, {
      expiresIn: USER_JWT_TIMEOUT,
    });
  }

  @Get('/authorised')
  @UseBefore(UserAuthorisation)
  async authorised(@Res() res: Response) {
    return res.status(200).end();
  }

  @Post('/login')
  @UseBefore(UserLogin)
  login(@Req() req: Request): JWTUserAuth {
    const jwt = this.UserService.getJwtUser(req.user);
    return {
      token: `JWT ${this.generateToken(jwt)}`,
      user: jwt,
    };
  }

  @Post('/forgot')
  async forgotPassword(@Body() body: ForgotPasswordRequest, @Req() req: Request) {
    const account = await this.UserService.getAccountByEmail(body.email);

    if (!account) {
      throw new Error(ErrorMessage.NO_ACCOUNT_EXISTS());
    }

    await this.EmailService.sendPasswordResetEmail(req, account);
    return SuccessResponse.Positive;
  }

  @Post('/reset')
  async resetPassword(@Body() body: ResetPasswordRequest) {
    await this.UserService.resetUserPassword(body.id, body.newPassword);
    return SuccessResponse.Positive;
  }

  @Get('/events')
  @UseBefore(UserAuthorisation)
  async getUserEvents(@AuthorisedUser() account: TESCAccount) {
    return this.UserService.getAccountPublicEvents(account);
  }

  @Post('/update/:eventAlias')
  @UseBefore(UserAuthorisation)
  @UseBefore(ValidateEventAlias)
  async updateUser(
    @AuthorisedUser() account: TESCAccount,
    @UploadedFile('resume', {options: Uploads, required: false}) resume: Express.Multer.File,
    @SelectedEvent() event: EventDocument,
    @BodyParam('user') body: UpdateUserRequest) {
    const user = await this.UserService.getUserApplication(event, account);
    await this.UserService.updateUserEditables(user, body, resume);

    return await this.UserService.getUserApplication(event, account, true);
  }
}
