import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
  date: Date;
  registrationCount: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  peakHour?: number;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    registrationCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalProcessingTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageProcessingTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    peakHour: {
      type: Number,
      min: 0,
      max: 23,
    },
  },
  {
    collection: 'analytics',
  },
);

AnalyticsSchema.index({ date: -1 });

export const AnalyticsModel = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
