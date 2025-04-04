import mongoose from "mongoose";

const ZoneSchema = new mongoose.Schema({
    ZoneName: {
        type: String,
        required: true,
        unique: false,
    },
    ZoneDescription: {
        type: String, // e.g., "read:users", "write:posts"
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    churchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Church",
        required: true,
    },
},
    {
        timestamps: true,
    }
);

export default mongoose.model("Zone", ZoneSchema);
