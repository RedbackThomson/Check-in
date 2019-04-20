import { TESCAccount } from 'Shared/types';
import bcrypt from 'bcrypt-nodejs';
import mongoose, { HookNextFunction } from 'mongoose';
import mongooseSanitizer from 'mongoose-sanitizer';

const Schema = mongoose.Schema;

type AccountType = TESCAccount & mongoose.Document & {
  comparePassword(password: string, cb: (err: Error, isMatch: boolean) => void): void;
};

const AccountSchema = new Schema({
  // Declares the user's email address
  email: {
    type: String,
    required: [true, 'You must have an email'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'You must use a valid email'],
  },
  // Declares the user's login password
  password: {
    type: String,
    trim: true,
    required: [true, 'You must have a password'],
  },
  // Declares the user has confirmed their email address
  confirmed: {
    type: Boolean,
    default: false,
  },
}, {timestamps: true});

AccountSchema.pre<AccountType>('save', function(next: HookNextFunction) {
  // tslint:disable-next-line:no-invalid-this no-this-assignment
  const user = this;
  const SALT_FACTOR = process.env.SALT_ROUNDS;

  if (!user.isModified('password')) {
    return next();
  }

  bcrypt.genSalt(SALT_FACTOR, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user.password, salt, null,
      (err, hash) => {
        if (err) {
          return next(err);
        }
        user.password = hash;
        next();
      });
  });
});

AccountSchema.method('comparePassword', function(candidatePassword: string,
  cb: (err: Error, isMatch?: boolean) => void) {
  // tslint:disable-next-line:no-invalid-this
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) {
      return cb(err, false);
    }

    cb(null, isMatch);
  });
});

AccountSchema.plugin(mongooseSanitizer);

export const AccountModel = mongoose.model<AccountType>('Account', AccountSchema);
