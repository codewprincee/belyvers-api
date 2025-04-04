import mongoose, { Schema, Document, Model } from "mongoose";

interface IDepartment extends Document {
    title: string;
    description: string;
    churchID: mongoose.Types.ObjectId | null;
    isActive: boolean
}

const DepartmentSchema: Schema<IDepartment> = new Schema(
    {
        title: {
            type: String,
            required: [true, "Department title is required"],
            trim: true, // Removes leading and trailing whitespace
        },
        description: {
            type: String,
            required: [true, "Department description is required"],
            trim: true,
        },
        churchID: {
            type: mongoose.Types.ObjectId,
            ref: "Church", // Refers to the Church model
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt timestamps
    }
);

// Export the model
const Department: Model<IDepartment> = mongoose.model<IDepartment>(
    "Department",
    DepartmentSchema
);

export default Department;
