import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// 1. Amua muundo wa TypeScript kwa ajili ya Hati ya Mtumiaji na Njia zake (User Interface)
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  isVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
}

// 2. Unda Schema ya Mongoose kwa ajili ya MongoDB yenye vipengele vya juu
const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Tafadhali weka jina lako kamili'],
      trim: true,
      maxlength: [60, 'Jina lisiwe zaidi ya herufi 60'],
    },
    email: {
      type: String,
      required: [true, 'Tafadhali weka barua pepe yako (Email)'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Tafadhali weka barua pepe iliyo sahihi',
      ],
    },
    password: {
      type: String,
      required: [true, 'Tafadhali weka neno la siri (Password)'],
      minlength: [6, 'Neno la siri lisiwe chini ya herufi 6'],
      select: false, // Inazuia neno la siri lisionekane wakati wa kusoma data (Queries)
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true, // Huweka kiotomatiki tarehe za kuundwa na kuboreshwa
  }
);

// 3. Mabadiliko ya Kabla ya Kuhifadhi: Kusimba Neno la Siri (Password Hashing via bcryptjs)
UserSchema.pre<IUser>('save', async function (next) {
  // Kama neno la siri halijabadilishwa, ruka hatua hii
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    if (this.password) {
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

// 4. Mbinu ya Kutengeneza JWT Token (Sign JWT and return)
UserSchema.methods.getSignedJwtToken = function (): string {
  return jwt.sign(
    { id: this._id, role: this.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpire as any }
  );
};

// 5. Mbinu ya Kulinganisha Neno la Siri wakati wa kuingia (Match user entered password to hashed password in database)
UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
