import { AdminDocument } from '@Models/Admin';
import { Admin } from '@Shared/Types';
import * as express from 'express';
import * as passport from 'passport';
import { ExpressMiddlewareInterface, UnauthorizedError } from 'routing-controllers';

export class AdminLogin implements ExpressMiddlewareInterface {
  authenticate = (callback?: (...args: any[]) => any) =>
    passport.authenticate('admin', { session: false }, callback);

  use(req: express.Request, res: express.Response, next?: express.NextFunction): Promise<passport.Authenticator> {
    return this.authenticate((err, user: AdminDocument, info) => {
      if (err || !user) {
        return next(new UnauthorizedError(info));
      }

      user.lastAccessed = new Date();
      user.save();

      req.user = user;
      return next();
    })(req, res, next);
  }
}