import mongoose, { Schema, Document } from "mongoose";

// Define the subscription interface
export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId; // Reference to User
    churchId: mongoose.Types.ObjectId; // Reference to Church
    subscriptionEnd: Date; // Subscription expiry date
    isTrialEnded: boolean; // Indicates if the trial period has ended
    features: string[]; // Features available with this subscription
}

// Define the schema
const SubscriptionSchema: Schema = new Schema(
    {
        userId: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },
        churchId: {
            type: mongoose.Types.ObjectId,
            ref: "Church",
            required: true,
        },
        subscriptionEnd: {
            type: Date,
            required: true, // Ensure a subscription end date is always provided
        },
        isTrialEnded: {
            type: Boolean,
            default: false,
        },
        features: [
            {
                type: String, // List of feature keys granted to the user via this subscription
            },
        ],
    },
    {
        timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
    }
);

// Export the model
export default mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
