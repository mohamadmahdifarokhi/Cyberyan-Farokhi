import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  did?: string;
  name?: string;
  vc?: {
    '@context': string[];
    type: string[];
    issuer: string;
    issuanceDate: string;
    credentialSubject: {
      id: string;
      name: string;
      email: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    did: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    vc: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  },
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ createdAt: -1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
