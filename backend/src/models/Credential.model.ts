import mongoose, { Schema, Document } from 'mongoose';

export interface ICredential extends Document {
  did: string;
  vc: Record<string, any>;
  userInfo: {
    name: string;
    email: string;
    passportImage?: string;
    selfieImage?: string;
  };
  jwt: string;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CredentialSchema = new Schema<ICredential>(
  {
    did: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    vc: {
      type: Schema.Types.Mixed,
      required: true,
    },
    userInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
      },
      passportImage: {
        type: String,
        trim: true,
      },
      selfieImage: {
        type: String,
        trim: true,
      },
    },
    jwt: {
      type: String,
      required: true,
    },
    fcmToken: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'credentials',
  },
);

CredentialSchema.index({ createdAt: -1 });
CredentialSchema.index({ 'userInfo.email': 1 });

export const CredentialModel = mongoose.model<ICredential>('Credential', CredentialSchema);
