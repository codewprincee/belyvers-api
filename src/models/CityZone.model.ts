import mongoose, { Schema } from "mongoose";


const CityZoneModel: Schema = new Schema({

    country: {
        type: String,
        required: true,
    },
    province: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    zone: {
        type: String,
        required: true,
    },
    church: {
        type: Schema.Types.ObjectId,
        ref: "Church",
        required: true,
    },
}, { timestamps: true })

export default mongoose.model("CityZone", CityZoneModel)


