import { CustomRequest } from "../../../middlewares/auth.middleware";
import UserModel from "../../../models/User.model";
import ApiResponse from "../../../utils/ApiResponse";
import asyncHandler from "../../../utils/asyncHandler";
import { Request, Response, NextFunction } from 'express';


export const me = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    // Extract user ID from the authenticated request (set by middleware)
    const userId = req?.user?._id; // Assuming `req.user` is populated by an auth middleware
    console.log('User ID:', userId);
    

    console.log('User ID:', userId);
    

    if (!userId) {
        return ApiResponse.error(res, 'Unauthorized access.', 401);
    }

    // Fetch the user's details from the database
    const user = await UserModel.findById(userId).select('-password -refreshToken'); // Exclude sensitive fields

    if (!user) {
        return ApiResponse.error(res, 'User not found.', 404);
    }

    // Return the user details
    return ApiResponse.success(res, { user });
});