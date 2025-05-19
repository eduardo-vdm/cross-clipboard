import mongoose, { Document, Schema } from 'mongoose';
import { ItemType } from '../types';

// Define base interfaces for the documents
export interface IClipboardItem {
  id: string;
  type: ItemType;
  content: string;
  version: number;
  createdAt: Date;
  lastModified: Date;
  deviceId: string;  // Add deviceId to track item ownership
  deviceName: string;  // Unique name throughout the sessions' items
}

export interface ISession {
  id: string;
  code: string;  // 6-digit session code
  items: IClipboardItem[];
  version: number;
  createdAt: Date;
  lastModified: Date;
  isArchived: boolean;
  createdBy: string;  // Device ID of the session creator
}

export interface IToken {
  token: string;
  fingerprint: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    ip: string;
    userAgent: string;
  };
}

// Define interfaces for the Mongoose documents
export interface IClipboardItemDocument extends Omit<IClipboardItem, 'id'>, Document {
  id: string;  // Override the _id with our custom id
}

export interface ISessionDocument extends Omit<ISession, 'id' | 'items'>, Document {
  id: string;  // Override the _id with our custom id
  items: IClipboardItemDocument[];
}

export interface ITokenDocument extends Omit<IToken, 'token'>, Document {
  token: string;
}

// ClipboardItem Schema
const clipboardItemSchema = new Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'image'] as ItemType[], 
    required: true 
  },
  content: { type: String, required: true },
  version: { type: Number, required: true, default: 1 },
  createdAt: { type: Date, required: true, default: Date.now },
  lastModified: { type: Date, required: true, default: Date.now },
  deviceId: { type: String, required: true },  // Add deviceId field to the schema
  deviceName: { type: String, required: true }  // Add deviceName field to the schema
}, { _id: false });  // Disable auto _id for subdocuments

// Session Schema
const sessionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, length: 6 },
  items: [clipboardItemSchema],
  version: { type: Number, required: true, default: 1 },
  createdAt: { type: Date, required: true, default: Date.now },
  lastModified: { type: Date, required: true, default: Date.now },
  isArchived: { type: Boolean, default: false },
  createdBy: { type: String, required: true }  // Add createdBy field
});

// Token Schema
const tokenSchema = new Schema<ITokenDocument>({
  token: { type: String, required: true, unique: true },
  fingerprint: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  metadata: {
    ip: String,
    userAgent: String,
    browserBrand: String,
    osPlatform: String,
    acceptLanguage: String
  },
});

// Indexes
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // 7 days TTL
sessionSchema.index({ id: 1 }, { unique: true });
sessionSchema.index({ code: 1 }, { unique: true });  // Index for the session code
sessionSchema.index({ isArchived: 1 });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Models
// The ClipboardItem model is no longer needed as we store items as embedded documents
export const Session = mongoose.model<ISessionDocument>('Session', sessionSchema); 
export const Token = mongoose.model<ITokenDocument>('Token', tokenSchema);