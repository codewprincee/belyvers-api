import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler";
import UserModel from "../models/User.model";
import ApiResponse from "../utils/ApiResponse";
import { Request, Response, NextFunction } from "express";

// Extend Request interface to include a user property
export interface CustomRequest extends Request {
    user?: any;
}

/**
 * Middleware to verify JWT tokens for authentication.
 */
export const verifyJWT = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.header("Authorization")?.replace("Bearer ", "").trim(); // Extract token

    if (!token) {
        console.log("Token is missing or not correctly formatted.");
        return ApiResponse.error(res, "You are not logged in. Please log in to access this resource.", 401);
    }
   



    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as jwt.JwtPayload & { id: string };

        if (!decodedToken?._id) {
            console.log("Decoded token does not contain an ID.");
            return ApiResponse.error(res, "Invalid or expired token. Please log in again to refresh your session.", 401);
        }

        const user = await UserModel.findById(decodedToken._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        );

        if (!user) {
            console.log(`User not found with ID: ${decodedToken._id}`);
            return ApiResponse.error(res, "Your session is no longer valid. Please log in again to continue.", 404);
        }

        req.user = user; // Attach user to the request
        next(); // Proceed to the next middleware or controller
    } catch (error: any) {
        console.error("Error verifying JWT token:", error.message); // Log any error
        return ApiResponse.error(res, "Invalid or expired token. Please log in again to refresh your session.", 401);
    }
});


/**
 * Middleware to verify user roles and permissions.
 * @param {string[]} roles - List of roles allowed to access the route.
 */
export const verifyPermission = (roles: string[] = []) =>
    asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
        if (!req.user?._id) {
            return ApiResponse.error(
                res,
                "Access denied. You must log in to perform this action.",
                401
            );
        }

        // Check if the user has at least one of the required roles
        const hasPermission = req.user.roles.some((role: string) => roles.includes(role));

        if (hasPermission) {
            next(); // Proceed if the user has one of the required roles
        } else {
            return ApiResponse.error(
                res,
                "You do not have the required permissions to perform this action.",
                403
            );
        }
    });


/**
 * Middleware to restrict access to development environments only.
 */
export const avoidInProduction = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === "development") {
        next(); // Allow access in development
    } else {
        return ApiResponse.error(
            res,
            "This feature is only available in the development environment. Please contact support for more details.",
            403
        );
    }
});
