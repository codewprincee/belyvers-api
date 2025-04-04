import { Router } from "express";
import { me } from "../../../controllers/client/user/User.controller";
import { verifyJWT } from "../../../middlewares/auth.middleware";


const router = Router()


router.route('/').get((req, res) => {
    res.send("Hello world");
});

router.route('/me').get(verifyJWT, me)

export default router;