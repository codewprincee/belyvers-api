import { Request, Response, Router } from "express";
import ApiResponse from "../../../utils/ApiResponse";

import { verifyJWT, verifyPermission } from "../../../middlewares/auth.middleware";
import { Roles } from "../../../constant";
import { CreateZone, GetAllZones, getMetricsDashboard, addLeader, fetchLeader, addTeamGospel, fetchTeamGospel, viewZoneData } from "../../../controllers/client/gospel/gospel.controller";
import { addNewConvertToChurch, inviationToChurch, dataEntry, getGospelDataEntry } from "../../../controllers/client/gospel/evangelization.controller";
import { addCitytoZone, viewZone, viewCityZone } from "../../../controllers/client/gospel/field.controller";

const router = Router();

router.route('/').get((req: Request, res: Response) => {
    return ApiResponse.success(res, [], 'Settings fetched successfully', 200)
})

router.route('/add-zone').post(verifyJWT, verifyPermission([Roles.Admin]), CreateZone)
router.route('/get-all-zones').get(verifyJWT, verifyPermission([Roles.Admin]), GetAllZones)

router.route('/add-new-convert-to-church').post(verifyJWT, verifyPermission([Roles.Admin]), addNewConvertToChurch)
router.route('/invitation-to-church').post(verifyJWT, verifyPermission([Roles.Admin]), inviationToChurch)
router.route('/add-gospel-data-entry').post(verifyJWT, verifyPermission([Roles.Admin]), dataEntry)
router.route('/get-gospel-data-entry').get(verifyJWT, verifyPermission([Roles.Admin]), getGospelDataEntry)
router.route('/add-city-to-zone').post(verifyJWT, verifyPermission([Roles.Admin]), addCitytoZone)
router.route('/view-zone').get(verifyJWT, verifyPermission([Roles.Admin]), viewZone)
router.route('/view-city-zone').get(verifyJWT, verifyPermission([Roles.Admin]), viewCityZone)
router.route('/get-metrics-dashboard').get(verifyJWT, verifyPermission([Roles.Admin]), getMetricsDashboard)
router.route('/add-leader-to-leader-ship').post(verifyJWT, verifyPermission([Roles.Admin]), addLeader)
router.route('/fetch-leader').get(verifyJWT, verifyPermission([Roles.Admin]), fetchLeader)
router.route('/add-team-gospel').post(verifyJWT, verifyPermission([Roles.Admin]), addTeamGospel)
router.route('/fetch-team-gospel').get(verifyJWT, verifyPermission([Roles.Admin]), fetchTeamGospel)
router.route('/view-members-zone').get(verifyJWT, verifyPermission([Roles.Admin]), viewZoneData)
export default router