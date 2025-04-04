import mongoose from "mongoose";


// const { firstName, lastName, email, phone, zone } = req.body;

const NewConvertSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    zone: {
        type: String,
        ref: "Zone",
        required: true
    },
    church: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Church",
        required: true
    },
    inviteToChurch: {
        type: Boolean,
        required: true
    },
    doSalvationPrayer: {
        type: Boolean,
        required: true
    }
},
{
    timestamps: true
})

const NewConvert = mongoose.model("NewConvert", NewConvertSchema);

export default NewConvert;