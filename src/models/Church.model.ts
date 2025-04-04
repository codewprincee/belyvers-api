import mongoose, { Schema, Document } from "mongoose";

export interface ILocation {
  zipCode?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface IChurch extends Document {
  churchName: string;
  subChurches: mongoose.Types.ObjectId[];
  mainChurch?: mongoose.Types.ObjectId;
  inviteCode?: string;
  locations: ILocation[];
  userId: mongoose.Types.ObjectId;
}

const LocationSchema: Schema = new Schema({
  zipCode: String,
  city: String,
  state: String,
  country: String
}, { _id: false });

const ChurchSchema: Schema = new Schema({
  churchName: {
    type: String,
    required: false,
    trim: true
  },
  subChurches: [{
    type: Schema.Types.ObjectId,
    ref: 'Church'
  }],
  mainChurch: {
    type: Schema.Types.ObjectId,
    ref: 'Church'
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  userId:{
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  locations: [LocationSchema]
}, {
  timestamps: true
});
ChurchSchema.index({ churchName: 1, 'locations.country': 1 }, { unique: true });

ChurchSchema.statics.findOrCreateByNameAndLocation = async function (churchName: string, location: ILocation) {
  let church = await this.findOne({ churchName, 'locations.country': location.country });
  if (!church) {
    church = await this.create({ churchName, locations: [location] });
  }
  return church;
};

export default mongoose.model<IChurch>('Church', ChurchSchema);