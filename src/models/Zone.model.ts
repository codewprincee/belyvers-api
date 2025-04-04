import mongoose, { Schema } from "mongoose";

const ZoneModel: Schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    church: {
        type: Schema.Types.ObjectId,
        ref: "Church",
        required: true,
    },

}, { timestamps: true })

const Zone = mongoose.model("ZoneChurch", ZoneModel)

export default Zone;
