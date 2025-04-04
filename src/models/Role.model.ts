import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    permissions: [{
        type: String, // e.g., "read:users", "write:posts"
        required: true,
    }],
});

export default mongoose.model("Role", RoleSchema);
