//@ts-ignore
//@ts-nocheck
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Role, Roles } from '../constant';  // Import from the new constant file

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  churchID: mongoose.Types.ObjectId; // Ensure churchID is ObjectId
  roles: Role[]; // Use the Role type for the roles field
  features: string[]; // Array of features assigned to the user
  refreshToken: string;
  refreshTokenExpiry: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  otp: string;
  otpExpiry: number;
  setPassword(password: string): Promise<void>;
  isGospel: boolean;
}


const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  churchID: { type: mongoose.Schema.Types.ObjectId, ref: 'Church', required: false },
  roles: { type: [String], enum: Object.values(Roles), default: [Roles.Admin] }, // Use the Roles constant here
  features: [{ type: String }], // Array of features assigned to the user
  refreshToken: { type: String, required: false },
  refreshTokenExpiry: { type: Date, required: false },
  otp: { type: String, required: false },  // OTP field
  otpExpiry: { type: Number, required: false },
  isGospel: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Set password method
UserSchema.methods.setPassword = async function (password: string): Promise<void> {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(password, salt);
};

// Generate access token
UserSchema.methods.generateAccessToken = function (): string {
  const payload = {
    _id: this._id,
    email: this.email,
    name: this.name,
    churchID: this.churchID,
    roles: this.roles,
    features: this.features,
  };

  const options: SignOptions = {
    expiresIn: process.env.NODE_ENV === 'production' 
      ? (process.env.ACCESS_TOKEN_EXPIRES || '1d')
      : '1d'
  };

  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, options);
};

// Generate refresh token
UserSchema.methods.generateRefreshToken = function (): string {
  const payload = {
    _id: this._id,
    email: this.email,
    name: this.name,
    churchID: this.churchID,
    roles: this.roles,
    features: this.features,
  };

  const options: SignOptions = {
    expiresIn: process.env.NODE_ENV === 'production'
      ? (process.env.REFRESH_TOKEN_EXPIRES || '7d')
      : '7d'
  };

  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET as string, options);
};

export default mongoose.model<IUser>('User', UserSchema);
