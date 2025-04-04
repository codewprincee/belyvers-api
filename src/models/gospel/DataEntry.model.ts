import mongoose from "mongoose";

const DataEntrySchema = new mongoose.Schema({
    //  const { date, time, zone, place, peopleEvangelized, newConverts, PeopleInvite } = req.body;
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },

    zone: {
        type: String,
        required: true
    },
    place: {
        type: String,
        required: true
    },
    peopleEvangelized: {
        type: Number,
        required: true
    },
    newConvertsMale: {
        type: Number,
        required: true
    },
    newConvertsFemale: {
        type: Number,
        required: true
    },
    PeopleInvite: {
        type: Number,
        required: true
    }
}, { timestamps: true });


const DataEntry = mongoose.model("DataEntry", DataEntrySchema);

export default DataEntry;