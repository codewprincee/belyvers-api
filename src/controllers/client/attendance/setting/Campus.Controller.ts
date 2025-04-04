import { CustomRequest } from "../../../../middlewares/auth.middleware";
import asyncHandler from "../../../../utils/asyncHandler";

export const addCampus = asyncHandler(async (req: CustomRequest, res) => {

    const { campusName, description, capacity, isActive } = req.body;

    



})