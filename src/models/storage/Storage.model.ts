import mongoose from "mongoose";



const storageSchema = new mongoose.Schema({
    churchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Church',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    name: {
        type: String,
        required: true,
        index: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['folder', 'file'],
        index: true,
    },
    size: {
        type: Number,
        required: false,
    },
    cloudinaryId: {
        type: String,
        required: false,
    },
    cloudinaryUrl: {
        type: String,
        required: false,
    },
    fileType: {
        type: String,
    },
    parentFolder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Storage',
        default: null,
        index: true,
    },
    sharedWith: [{
        email: String,
        accessType: {
            type: String,
            enum: ['read', 'write'],
            default: 'read'
        }
    }],
    isShared: {
        type: Boolean,
        default: false,
    },  
    isSubFolder: {
        type: Boolean,
        default: false,
    },
    shareableLink: {
        type: String,
        default: null,
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    permissions: {
        type: String,
    },
    isEncrypted: {
        type: Boolean,
        default: false,
    },
    encryptionPassword: {
        type: String,
        default: null,
    },
    localPath: {
        type: String,
        required: false
    },
    readableSize: {
        type: String,
        required: false
    },
    fileCategory: {
        type: String,
        required: false
    },
    sharedBy: {
        type: String,
        required: false,
    },
}, { timestamps: true });

// Add compound index for name and parentFolder
storageSchema.index({ name: 1, parentFolder: 1 }, { unique: true });

const Storage = mongoose.model("Storage", storageSchema);

export default Storage;



