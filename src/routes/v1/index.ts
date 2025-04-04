import Router from "express";
import authRoute from './auth/auth.route'
import userRoute from './user/user.route'
import directoryRoute from './directory/directory.route'
import settingRoute from './settings/setting.route'
import gospelRoute from './gospel/gospel.route'
import storageRoute from './storage/storage.route'
import { verifyJWT, verifyPermission } from "../../middlewares/auth.middleware";
import { Roles } from "../../constant";
const router = Router()


router.route('/').get((req, res) => {
    res.send("API V1 Route")
})

router.use('/auth', authRoute)
router.use('/user', userRoute)
router.use('/directory', verifyJWT, directoryRoute)
router.use('/settings', verifyJWT, verifyPermission([Roles.Admin]), settingRoute)
router.use('/gospel', verifyJWT, verifyPermission([Roles.Admin]), gospelRoute)
router.use('/storage', verifyJWT, verifyPermission([Roles.Admin]), storageRoute)
export default router