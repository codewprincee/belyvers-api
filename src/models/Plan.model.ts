import mongoose, { Schema, Document } from "mongoose";

export interface IPlan extends Document {
    name: string;
    description: string;
    price: {
        monthly: number;
        annually: number;
    };
    metrics: {
        type: string;
        limit: number;
    };
    logs: {
        type: string;
        retention: number;
    };
    features: string[];
    recommended: boolean;
    active: boolean;
    planType: 'free' | 'basic' | 'standard' | 'premium';
    platformType: 'web' | 'desktop';
    createdAt: Date;
    updatedAt: Date;
}

const PlanSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: {
        monthly: { type: Number, required: true },
        annually: { type: Number, required: true }
    },
    metrics: {
        type: { type: String, required: true },
        limit: { type: Number, required: true }
    },
    logs: {
        type: { type: String, required: true },
        retention: { type: Number, required: true }
    },
    features: [{ type: String }],
    recommended: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    planType: { type: String, enum: ['freemium', 'basic', 'standard', 'premium'], required: true },
    platformType: { type: String, enum: ['web', 'desktop'], required: true }
}, { timestamps: true });

export default mongoose.model<IPlan>('Plan', PlanSchema);