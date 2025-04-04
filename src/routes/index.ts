import { Router } from "express";
import v1Route from './v1/index'

const router = Router();

router.use("/v1", v1Route);

router.get('/', (req, res) => {
    res.send("Hello Belivers Sir")
})

export default router