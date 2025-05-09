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
}

export interface ISession {
  id: string;
  code: string;  // 6-digit session code
  items: IClipboardItem[];
  version: number;
  createdAt: Date;
  lastModified: Date;
  isArchived: boolean;
}

// Define interfaces for the Mongoose documents
export interface IClipboardItemDocument extends Omit<IClipboardItem, 'id'>, Document {
  id: string;  // Override the _id with our custom id
}

export interface ISessionDocument extends Omit<ISession, 'id' | 'items'>, Document {
  id: string;  // Override the _id with our custom id
  items: IClipboardItemDocument[];
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
  lastModified: { type: Date, required: true, default: Date.now }
}, { _id: false });  // Disable auto _id for subdocuments

// Session Schema
const sessionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, length: 6 },
  items: [clipboardItemSchema],
  version: { type: Number, required: true, default: 1 },
  createdAt: { type: Date, required: true, default: Date.now },
  lastModified: { type: Date, required: true, default: Date.now },
  isArchived: { type: Boolean, default: false }
});

// Indexes
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // 7 days TTL
sessionSchema.index({ id: 1 }, { unique: true });
sessionSchema.index({ code: 1 }, { unique: true });  // Index for the session code
sessionSchema.index({ isArchived: 1 });

// Models
export const Session = mongoose.model<ISessionDocument>('Session', sessionSchema); 