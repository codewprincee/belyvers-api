import { Router, Request, Response } from "express";
import {
  AddMember,
  getAllLeaders,
  getAllMembers,
  getAllRole,
  getDirectoryAnalytics,
  getMemberByRole,
  getSingleMemberDetail,
  searchMember,
  searchMembers,
  updateMemberRole,
  updateToLeader,
  updateToPastor,
  updateToServant,
} from "../../../controllers/client/directory/Directory.controller";

const router = Router();
// Fix the GET route
router.route("/").get((req: Request, res: Response) => {
  // Logic for the GET request goes here
  res.status(200).json({
    success: true,
    message: "Directory fetched successfully",
  });
});

// POST route for adding a member
router.route("/add-member").post(AddMember);
router.route("/fetch-members").get(getAllMembers);

// GET route for searching members
router.route("/search").get(searchMembers);
router.route("/fetchMember").post(getSingleMemberDetail);
router.route("/analytcis").get(getDirectoryAnalytics);
router.route('/getAllLeaders').get(getAllLeaders);
router.route("/update-servant").post(updateToServant);
router.route('/update-leader').post(updateToLeader)
router.route('/update-pastor').post(updateToPastor)
router.route('/updateRole').post(updateMemberRole);
router.route('/fetchRole').get(getAllRole)
router.route('/getMemberByRole/:role').get(getMemberByRole)
router.route('/searchMember').get(searchMember)
export default router;
