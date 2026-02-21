import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  did: string;
  hash: string;
  operation: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  processingTime?: number;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    did: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    hash: {
      type: String,
      required: true,
      trim: true,
    },
    operation: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    processingTime: {
      type: Number,
      min: 0,
    },
  },
  {
    collection: 'auditlogs',
  },
);

AuditLogSchema.index({ did: 1, timestamp: -1 });
AuditLogSchema.index({ operation: 1, timestamp: -1 });

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
