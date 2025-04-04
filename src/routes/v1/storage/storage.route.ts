import { Router } from "express";
import { deleteStorage, downloadFile, getAllSharedFiles, getFilePreview, getSharedByMe, getSharedWithMe, getSubFolders, shareFile } from "../../../controllers/client/storage/Storage.controller";
import { getAllStorage } from "../../../controllers/client/storage/Storage.controller";
import { createFolder, updateStorage, getStorageById, getFolderPath, renameStorage } from "../../../controllers/client/storage/Storage.controller";
import { uploadFile } from "../../../controllers/client/storage/Storage.controller";
import { getAllStorageInFolder, shareStorage } from "../../../controllers/client/storage/Storage.controller";
import { createStorage } from "../../../controllers/client/storage/Storage.controller";
import { upload } from "../../../config/cloudinary";
import { verifyPermission } from "../../../middlewares/auth.middleware";
import { Roles } from "../../../constant";
import { verifyJWT } from "../../../middlewares/auth.middleware";

const router = Router();
router.route('/').get(verifyJWT, verifyPermission([Roles.Admin]), getAllStorage);
router.route('/shared-with-me').get(verifyJWT, verifyPermission([Roles.Admin]), getSharedWithMe);
router.route('/shared-by-me').get(verifyJWT, verifyPermission([Roles.Admin]), getSharedByMe);
router.route('/all-shared-files').get(verifyJWT, verifyPermission([Roles.Admin]), getAllSharedFiles);
router.route("/create-folder").post(verifyJWT, verifyPermission([Roles.Admin]), createFolder);
router.route("/upload-file").post(verifyJWT, verifyPermission([Roles.Admin]), upload.single('file'), uploadFile);
router.route("/folder-path/:folderId").get(verifyJWT, verifyPermission([Roles.Admin]), getFolderPath);
router.route("/folder/:folderId").get(verifyJWT, verifyPermission([Roles.Admin]), getAllStorageInFolder);
router.route("/subfolders/:parentFolderId").get(verifyJWT, verifyPermission([Roles.Admin]), getSubFolders);

router.route("/file-preview/:id").get(verifyJWT, verifyPermission([Roles.Admin]), getFilePreview);
router.route("/download/:id").get(verifyJWT, verifyPermission([Roles.Admin]), downloadFile);
router.route("/rename/:id").put(verifyJWT, verifyPermission([Roles.Admin]), renameStorage);
router.route("/share/:id").post(verifyJWT, verifyPermission([Roles.Admin]), shareStorage);
router.route('/share-file/:id').post(verifyJWT, verifyPermission([Roles.Admin]), shareFile);
router.route("/:id").get(verifyJWT, verifyPermission([Roles.Admin]), getStorageById)
    .put(verifyJWT, verifyPermission([Roles.Admin]), updateStorage)
    .delete(verifyJWT, verifyPermission([Roles.Admin]), deleteStorage);

export default router;