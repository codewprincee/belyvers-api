import mongoose from "mongoose";


const InviteToChurchSchema = new mongoose.Schema({
   name: {
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
   recipientMail: {
    type: String,
    required: true
   },
   subject: {
    type: String,
    required: true
   },
   churchName: {
    type: String,
    required: true
   },
   churchAddress: {
    type: String,
    required: true
   },
   churchServiceTime: {
    type: String,
    required: true
   },
   body: {
    type: String,
    required: true
   },
   churchID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Church",
    required: true
   }
}, { timestamps: true });

const InviteToChurch = mongoose.model("InviteToChurch", InviteToChurchSchema);

export default InviteToChurch;