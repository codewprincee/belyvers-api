import mongoose, { Schema, Document } from "mongoose";

interface IMember extends Document {
  firstName: string;
  lastName: string;
  dob: string;
  homeAddress: string;
  email: string;
  phone: string;
  emergencyPhone: string;
  emergencyContactName: string;
  city: string;
  country: string;
  zipCode: string;
  state: string;
  professionalStatus: string;
  academicStatus: string;
  transportationStatus: string;
  spiritualTraining: string;
  salvationPrayer: string;
  profilePicture: string | null;
  churchDiscovery: string;
  ageGroup: string | null;
  title: string;
  role: string;
  description: string;
  leader: mongoose.Types.ObjectId[]; // Array of leader ObjectIds
  departmentAssigned: { title: string; value: string }[]; // Updated definition
  peopleAssigned: mongoose.Types.ObjectId[];
  servantAssignedLeader: mongoose.Types.ObjectId[];
  reportingLeader: mongoose.Types.ObjectId[];
  church: string;
}

const memberSchema: Schema = new Schema(
  {
    churchId: {
      type: mongoose.Types.ObjectId,
      ref: "Church",
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    ageGroup: {
      type: String,
      required: false,
    },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    dob: { type: String, required: false },
    homeAddress: { type: String, default: "", required: false },
    email: { type: String, required: false, unique: true },
    phone: { type: String, required: false },
    emergencyPhone: { type: String, required: false },
    gender: { type: String, required: false },
    emergencyContactName: { type: String, required: false },
    city: { type: String, required: false },
    country: { type: String, required: false },
    departmentAssigned: [
      {
        title: { type: String, required: true },
        value: { type: String, required: true },
      },
    ], // Updated definition
    zipCode: { type: String, required: false },
    state: { type: String, required: false },
    professionalStatus: { type: String, default: "No" },
    academicStatus: { type: String, default: "No" },
    transportationStatus: { type: String, default: "No" },
    spiritualTraining: { type: String, default: "No" },
    salvationPrayer: { type: String, default: "No" },
    profilePicture: { type: String, default: null },
    churchDiscovery: { type: String, default: "" },
    role: { type: String, default: "member" },
    memberID: { type: String, default: "" },
    title: { type: String, required: false },
    description: { type: String, required: false },
    church: {
      type: String,
      required: false,
    },
    leader: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Member", // Reference to another Member object
      },
    ], // Array of leader ObjectIds
    peopleAssigned: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Member", // Reference to another Member object
      },
    ], // Array of leader ObjectIds
    reportingLeader: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Member", // Reference to another Member object
      },
    ], // Array of leader ObjectIds
    isUpgradeToGospel: {
      type: Boolean,
      default: false
    },
    isZoneAssigned: {
      type: Boolean,
      default: false
    },
    zoneAssigned: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

const Member = mongoose.model<IMember>("Member", memberSchema);

export default Member;
