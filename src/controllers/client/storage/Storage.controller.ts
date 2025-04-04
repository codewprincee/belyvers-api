//@ts-nocheck
import Storage from '../../../models/storage/Storage.model';
import multer from 'multer'; // Import multer for file uploads
import path from 'path';
import asyncHandler from '../../../utils/asyncHandler';
import ApiResponse from '../../../utils/ApiResponse';
import { v4 as uuidv4 } from 'uuid'; // Import UUID for generating unique links
import cloudinary from '../../../config/cloudinary';
import { CustomRequest } from '../../../middlewares/auth.middleware';
import crypto from 'crypto';
import fs from 'fs';
import { log } from 'winston';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the upload directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to file name
    },
});

const uploadMulter = multer({ storage });

// Add this helper function at the top of the file
const getUniqueFileName = async (originalName: string, parentFolder: string | null) => {
    let fileName = originalName;
    let counter = 1;
    let isUnique = false;

    // Extract name and extension
    const lastDotIndex = originalName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName;
    const extension = lastDotIndex !== -1 ? originalName.slice(lastDotIndex) : '';

    while (!isUnique) {
        // Check if file with current name exists
        const existingFile = await Storage.findOne({
            name: fileName,
            parentFolder: parentFolder
        });

        if (!existingFile) {
            isUnique = true;
        } else {
            // Increment counter and update filename
            fileName = `${nameWithoutExt} (${counter})${extension}`;
            counter++;
        }
    }

    return fileName;
};

// Create a  storage item
export const createStorage = asyncHandler(async (req: CustomRequest, res) => {
    try {
        req.body.churchId = req.user.churchId;
        const storageItem = new Storage(req.body);
        await storageItem.save();
        return ApiResponse.success(res, storageItem, "Storage item created successfully", 201);
    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});

// Read all storage items
export const getAllStorage = asyncHandler(async (req, res) => {
    const { churchID } = req.user;
    try {
        const storageItems = await Storage.find({ churchId: churchID, isSubFolder: false });
        return ApiResponse.success(res, storageItems, "Storage items fetched successfully");
    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});

// Read a single storage item by ID
export const getStorageById = asyncHandler(async (req: CustomRequest, res) => {
    try {
        const storageItem = await Storage.findOne({ _id: req.params.id, churchId: req.user.churchId });
        if (!storageItem) return ApiResponse.error(res, "Storage item not found");
        return ApiResponse.success(res, storageItem, "Storage item fetched successfully");
    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});

// Update a storage item by ID
export const updateStorage = asyncHandler(async (req: CustomRequest, res) => {
    try {
        const storageItem = await Storage.findOneAndUpdate({ _id: req.params.id, churchId: req.user.churchId }, req.body, { new: true });
        if (!storageItem) return ApiResponse.error(res, "Storage item not found");
        return ApiResponse.success(res, storageItem, "Storage item updated successfully");
    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});

// Delete a storage item (file or folder) by ID
export const deleteStorage = asyncHandler(async (req: CustomRequest, res) => {
    try {
        const storageItem = await Storage.findOneAndDelete({ _id: req.params.id, churchId: req.user.churchId });
        if (!storageItem) return ApiResponse.error(res, "Storage item not found");

        // If it's a folder, delete all its contents first
        if (storageItem.type === 'folder') {
            const items = await Storage.find({ parentFolder: storageItem._id });
            for (const item of items) {
                if (item.type === 'file') {
                    // Delete from Cloudinary
                    await cloudinary.uploader.destroy(item?.cloudinaryId || '');
                }
                await Storage.findByIdAndDelete(item._id);
            }
        } else if (storageItem.type === 'file') {
            // Delete single file from Cloudinary
            await cloudinary.uploader.destroy(storageItem?.cloudinaryId || '');
        }

        await Storage.findByIdAndDelete(req.params.id);
        return ApiResponse.success(res, null, "Storage item deleted successfully");
    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});

// Create a  folder
export const createFolder = asyncHandler(async (req: CustomRequest, res) => {
    try {
        const { churchID } = req.user;

        // Get unique folder name
        const uniqueFolderName = await getUniqueFileName(
            req.body.name,
            req.body.parentFolder || null
        );

        const folder = new Storage({
            churchId: churchID,
            name: uniqueFolderName,
            type: 'folder',
            parentFolder: req.body.parentFolder || null, // This will store the parent folder's ID
            isSubFolder: req.body.parentFolder ? true : false,
            dateAdded: new Date()
        });

        await folder.save();
        return ApiResponse.success(res, folder, "Folder created successfully", 201);
    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});
export const createParentFolder = asyncHandler(async (req: CustomRequest, res: Response) => {

    const { churchID } = req.user;
    const { name } = req.body;
    const parentFolder = await Storage.findOne({ name: name, churchId: churchID, isSubFolder: false });
    if (parentFolder) {
        return ApiResponse.error(res, "Parent folder already exists");
    }
    const newParentFolder = new Storage({
        name: name,
        churchId: churchID,
        type: "folder",
        isSubFolder: false,
        dateAdded: new Date()
    })

})

// Upload a file to a specific folder
export const uploadFile = asyncHandler(async (req: CustomRequest, res) => {
    try {
        const { churchID } = req.user;
        if (!req.file) {
            return ApiResponse.error(res, "No file uploaded");
        }

        // Get unique filename for the database
        const uniqueFileName = await getUniqueFileName(
            req.file.originalname,
            req.body.parentFolder || null
        );

        // Create local file path
        const relativePath = req.file.path.replace(/\\/g, '/'); // Convert Windows paths to Unix style

        // Upload to cloudinary as backup
        const result = await cloudinary.uploader.upload(req.file.path);

        // Create file record in database
        const fileItem = new Storage({
            churchId: churchID,
            name: uniqueFileName,
            type: 'file',
            size: req.file.size,
            cloudinaryId: result.public_id,
            cloudinaryUrl: result.secure_url,
            localPath: relativePath, // Store the local path
            fileType: req.file.mimetype,
            parentFolder: req.body.parentFolder || null,
            dateAdded: new Date(),
            isEncrypted: req.body.isEncrypted || false,
            readableSize: getReadableFileSize(req.file.size),
            fileCategory: getFileType(req.file.mimetype)
        });

        if (req.body.isEncrypted) {
            fileItem.encryptionPassword = crypto.randomBytes(8).toString('hex');
        }

        await fileItem.save();

        return ApiResponse.success(res, {
            ...fileItem.toObject(),
            readableSize: getReadableFileSize(req.file.size)
        }, "File uploaded successfully", 201);

    } catch (error) {
        // If there's an error, try to clean up the uploaded file
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }
        return ApiResponse.error(res, error as string);
    }
});

// Read all storage items in a specific folder
export const getAllStorageInFolder = asyncHandler(async (req: CustomRequest, res) => {
    try {
        const storageItems = await Storage.find({
            parentFolder: req.params.folderId,
            churchId: req.user.churchId,
            deleted: false
        }).sort({
            type: -1, // Folders first
            name: 1   // Then alphabetically
        });

        return ApiResponse.success(res, storageItems, "Storage items fetched successfully");
    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});

// Share a file or folder
export const shareStorage = asyncHandler(async (req: CustomRequest, res) => {
    const { id } = req.params;
    const { email, isEncrypted } = req.body;
    const { churchID } = req.user;

    try {
        const storageItem = await Storage.findOne({ _id: id, churchId: churchID });
        console.log(storageItem);

        if (!storageItem) {
            return ApiResponse.error(res, "Storage item not found");
        }

        let encryptionPassword = null;
        if (isEncrypted) {
            // Generate random password
            encryptionPassword = crypto.randomBytes(8).toString('hex');
            storageItem.isEncrypted = true;
            storageItem.encryptionPassword = encryptionPassword;
            storageItem.isShared = true;
        }

        // Add email to sharedWith array if not already present
        if (!storageItem.sharedWith.find(share => share.email === email)) {
            storageItem.sharedWith.push({ email, accessType: 'read' });
        }

        await storageItem.save();

        return ApiResponse.success(res, {
            message: "Storage item shared successfully",
            encryptionPassword
        });
    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});

// Rename storage item
export const renameStorage = asyncHandler(async (req: CustomRequest, res) => {
    const { id } = req.params;
    const { newName } = req.body;
    console.log(id);
    console.log(newName);



    const storageItem = await Storage.findById(id);
    if (!storageItem) {
        return ApiResponse.error(res, "Storage item not found");
    }
    console.log("storageItem", storageItem);


    // Get unique name for the renamed item
    const uniqueName = await getUniqueFileName(
        newName,
        storageItem.parentFolder
    );

    storageItem.name = uniqueName;
    await storageItem.save();

    return ApiResponse.success(res, storageItem, "Storage item renamed successfully");

});

// Download file
export const downloadFile = asyncHandler(async (req: CustomRequest, res) => {
    const { id } = req.params;

    try {
        const file = await Storage.findOne({ _id: id, churchId: req.user.churchId });
        if (!file || file.type !== 'file') {
            return ApiResponse.error(res, "File not found");
        }

        // Check encryption
        if (file.isEncrypted) {
            const { password } = req.query;
            if (!password || password !== file.encryptionPassword) {
                return ApiResponse.error(res, "Invalid password");
            }
        }

        // Try to serve local file first
        if (file.localPath && fs.existsSync(file.localPath)) {
            return res.download(file.localPath, file.name);
        }

        // Fallback to cloudinary URL
        return ApiResponse.success(res, {
            downloadUrl: file.cloudinaryUrl
        }, "Download URL generated");

    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});

// Search storage items
export const searchStorage = asyncHandler(async (req: CustomRequest, res) => {
    const { query, type } = req.query;

    try {
        const filter: any = {
            name: { $regex: query, $options: 'i' }
        };

        if (type) {
            filter.type = type;
        }

        const items = await Storage.find(filter);
        return ApiResponse.success(res, items, "Search results fetched successfully");
    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});

// Generate shareable link
export const generateShareableLink = asyncHandler(async (req: CustomRequest, res) => {
    const { id } = req.params;
    const { isEncrypted } = req.body;

    try {
        const storageItem = await Storage.findOne({ _id: id, churchId: req.user.churchId });
        if (!storageItem) {
            return ApiResponse.error(res, "Storage item not found");
        }

        let encryptionPassword = null;
        if (isEncrypted) {
            encryptionPassword = crypto.randomBytes(8).toString('hex');
            storageItem.isEncrypted = true;
            storageItem.encryptionPassword = encryptionPassword;
        }

        // Generate unique shareable link
        const shareableLink = `${process.env.APP_URL}/share/${id}`;
        storageItem.shareableLink = shareableLink;

        await storageItem.save();

        return ApiResponse.success(res, {
            shareableLink,
            encryptionPassword
        });
    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});

// Get folder path (for breadcrumb navigation)
export const getFolderPath = asyncHandler(async (req: CustomRequest, res) => {
    const { folderId } = req.params;

    try {
        const path = [];
        let currentFolder = await Storage.findOne({ _id: folderId, churchId: req.user.churchId });

        while (currentFolder) {
            path.unshift({
                id: currentFolder._id,
                name: currentFolder.name
            });

            if (currentFolder.parentFolder) {
                currentFolder = await Storage.findOne({ _id: currentFolder.parentFolder, churchId: req.user.churchId });
            } else {
                break;
            }
        }

        // Add root folder
        path.unshift({ id: null, name: 'Root' });

        return ApiResponse.success(res, path, "Folder path fetched successfully");
    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});

// Helper function to get readable file size
export const getReadableFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round((bytes / Math.pow(1024, i))) + ' ' + sizes[i];
};

// Helper function to get file type from mime type
export const getFileType = (mimeType: string): string => {
    const types: { [key: string]: string } = {
        'image/': 'Image',
        'application/pdf': 'PDF',
        'application/msword': 'Word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
        'application/vnd.ms-excel': 'Excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
        'text/': 'Text',
        'application/zip': 'Archive',
        'application/x-zip-compressed': 'Archive'
    };

    for (const [key, value] of Object.entries(types)) {
        if (mimeType.startsWith(key)) return value;
    }
    return 'Other';
};


export const getFilePreview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const file = await Storage.findById(id);
    return ApiResponse.success(res, file, "File preview fetched successfully");
});

export const getAllSharedFiles = asyncHandler(async (req, res) => {
    const files = await Storage.find({ sharedWith: { $ne: [] } });
    return ApiResponse.success(res, files, "All shared files fetched successfully");
});

export const shareFile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { email, isEncrypted } = req.body;

    try {
        const storageItem = await Storage.findById(id);
        console.log(storageItem);

        if (!storageItem) {
            return ApiResponse.error(res, "Storage item not found");
        }

        // Add email to sharedWith array if not already present
        if (!storageItem.sharedWith.find(share => share.email === email && share.accessType === 'read')) {
            storageItem.sharedWith.push({ email, accessType: 'read', isShared: true });
        }

        await storageItem.save();

        return ApiResponse.success(res, {
            message: "File shared successfully",
            encryptionPassword
        });
    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});

export const getSharedWithMe = asyncHandler(async (req: CustomRequest, res) => {
    const sharedFiles = await Storage.find({ 'sharedWith': req.user.churchId });
    console.log(sharedFiles);

    return ApiResponse.success(res, sharedFiles, "All shared files fetched successfully");
});

export const getSharedByMe = asyncHandler(async (req: CustomRequest, res) => {
    const { churchID } = req.user;
    const sharedFiles = await Storage.find({ 'churchId': churchID, isShared: true });
    console.log(sharedFiles);

    return ApiResponse.success(res, sharedFiles, "All shared files fetched successfully");
});

export const getSubFolders = asyncHandler(async (req: CustomRequest, res) => {
    try {
        const { parentFolderId } = req.params;
        const { churchID } = req.user;

        const subFolders = await Storage.find({
            churchId: churchID,
            parentFolder: parentFolderId,
            isSubFolder: true,
            type: 'folder'
        }).sort({ name: 1 }); // Sort alphabetically by name

        return ApiResponse.success(res, subFolders, "Subfolders fetched successfully");
    } catch (error) {
        return ApiResponse.error(res, error as string);
    }
});


