import { Request, Response, Router } from "express";
import ApiResponse from "../../../utils/ApiResponse";
import { addDepartments, addTeamMember, getAllTeamMember } from "../../../controllers/client/setting/Role.controller";
import { verifyJWT, verifyPermission } from "../../../middlewares/auth.middleware";
import { Roles } from "../../../constant";



const router = Router();

router.route('/').get((req: Request, res: Response) => {
    return ApiResponse.success(res, [], 'Settings fetched successfully', 200)
})

router.route('/add-team-member').post(verifyJWT, verifyPermission([Roles.Admin]), addTeamMember)
router.route('/add-department').post(addDepartments)
router.route('/team-members').get(verifyJWT,getAllTeamMember)

export default router