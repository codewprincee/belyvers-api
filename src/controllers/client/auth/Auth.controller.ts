import asyncHandler from "../../../utils/asyncHandler";
import User from "../../../models/User.model";
import { Request, Response } from 'express';
import ApiResponse from "../../../utils/ApiResponse";
import validator from 'validator';
import jwt from 'jsonwebtoken';
import ChurchModel from "../../../models/Church.model";
import mongoose from "mongoose";
import crypto from 'crypto';  // To generate a secure OTP
import { sendForgotPasswordEmail } from "../../../utils/emailSender";
import bcrypt from 'bcrypt';
export const createAccount = asyncHandler(async (req: Request, res: Response) => {
    const { name, email: rawEmail, password, location } = req.body;
    const email = rawEmail?.trim().toLowerCase();

    // Validate inputs
    if (!name || !email || !password) {
        return ApiResponse.error(res, 'Name, email, and password are required.', 400);
    }

    if (!validator.isEmail(email)) {
        return ApiResponse.error(res, 'Invalid email format.', 400);
    }

    if (!validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })) {
        return ApiResponse.error(res, 'Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character.', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return ApiResponse.error(res, 'User with this email already exists.', 400);
    }

    // Create the user
    const user = new User({ name, email, password });
    await user.save();

    // Create a church linked to the user
    const church = new ChurchModel({
        churchName: `${name}${Math.floor(Math.random() * (1000 - 90 + 1)) + 90}'s Church`,

        userId: user._id,
        locations: location ? [location] : [] // Use provided location if available
    });

    await church.save();


    //@ts-ignore
    // Update the user with the churchId
    user.churchID = church._id
    await user.save();

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Respond with success
    ApiResponse.success(res, {
        userId: user._id,
        name: user.name,
        email: user.email,
        churchId: church._id,
        accessToken,
        refreshToken,
    }, 'Account and church created successfully', 201);
});



export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    console.log(password);


    // Validate input
    if (!email || !password) {
        return ApiResponse.error(res, "Both email and password are required to log in.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if the user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        return ApiResponse.error(
            res,
            "The email or password you entered is incorrect. Please try again.",
            401
        );
    }

    // Validate the provided password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        return ApiResponse.error(
            res,
            "The email or password you entered is incorrect. Please try again.",
            401
        );
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save the refresh token in the database
    user.refreshToken = refreshToken;
    await user.save();

    // Send response
    return ApiResponse.success(
        res,
        {
            user: {
                userId: user._id,
                name: user.name,
                email: user.email,
                churchId: user.churchID

            },
            roles: ['sub-admin', 'admin'],
            features: ['directory'],
            accessToken,
            refreshToken,
        },
        "Login successful! Welcome back.",
        200
    );
});
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken: token } = req.body;

    if (!token) {
        console.error('[RefreshToken] Missing refresh token in request body.');
        return ApiResponse.error(res, 'Refresh token is required.', 400);
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as jwt.JwtPayload;

    if (!decoded || !decoded._id) {
        console.error('[RefreshToken] Invalid token payload.');
        return ApiResponse.error(res, 'Invalid refresh token.', 401);
    }

    const user = await User.findById(decoded._id);
    if (!user) {
        console.error('[RefreshToken] User not found for token payload:', decoded._id);
        return ApiResponse.error(res, 'Invalid refresh token.', 401);
    }

    if (user.refreshToken !== token) {
        console.error('[RefreshToken] Provided refresh token does not match stored token.');
        return ApiResponse.error(res, 'Invalid refresh token.', 401);
    }

    if (user.refreshTokenExpiry && user.refreshTokenExpiry.getTime() < Date.now()) {
        console.error('[RefreshToken] Refresh token has expired.');
        return ApiResponse.error(res, 'Refresh token has expired.', 401);
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    console.log('[RefreshToken] Tokens refreshed successfully for user:', user._id);

    return ApiResponse.success(res, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    }, 'Tokens refreshed successfully');

});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    // Regex to validate email
    const isEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Check if the email is valid
    if (!email || !isEmail.test(email)) {
        return ApiResponse.error(res, 'Invalid Email', 400, 'Error1');
    }

    // Check if user exists with this email
    const user = await User.findOne({ email });
    if (!user) {
        return ApiResponse.error(res, 'No user found with this email address', 404, 'Error2');
    }

    // Generate a temporary OTP (6-digit number)
    const otp = crypto.randomInt(100000, 999999).toString();

    // Save OTP and expiration date in the database
    // Assuming User model has an otp field and otpExpiry field for this purpose
    user.otp = otp;
    user.otpExpiry = Date.now() + 15 * 60 * 1000;  // OTP valid for 15 minutes
    await user.save();

    await sendForgotPasswordEmail(email, otp)

    // Send a success response
    return ApiResponse.success(res, [], 'OTP sent to your email address', 200);
});


export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    // Check if email and OTP are provided
    if (!email || !otp) {
        return ApiResponse.error(res, 'Email and OTP are required', 400, 'Error3');
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
        return ApiResponse.error(res, 'No user found with this email address', 404, 'Error4');
    }

    // Check if OTP matches and is not expired
    if (user.otp !== otp) {
        return ApiResponse.error(res, 'Invalid OTP', 400, 'Error5');
    }

    // Check if OTP is expired
    const otpExpiry = user.otpExpiry;
    if (Date.now() > otpExpiry) {
        return ApiResponse.error(res, 'OTP has expired', 400, 'Error6');
    }

    // OTP is valid, generate a verification token for further actions (like resetting the password)
    const verificationToken = jwt.sign(
        { email: user.email, otp: user.otp },
        process.env.ACCESS_TOKEN_SECRET as string, // You should store your secret in the environment variables
        { expiresIn: '15m' } // Set a 15-minute expiration for the verification token
    );

    // Send the verification token in the response to the user
    return ApiResponse.success(res, { verificationToken }, 'OTP verified successfully. Use the token to reset your password.', 200);
});


 // Reset Password
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { newPassword } = req.body;

    console.log(newPassword);

    // Check if newPassword is provided
    if (!newPassword) {
        return ApiResponse.error(res, 'New password is required', 400, 'Error7');
    }

    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1]; // Assuming token is passed in the format "Bearer <token>"
    if (!token) {
        return ApiResponse.error(res, 'Token is required', 400, 'Error7');
    }

    // Verify the token (JWT)
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
    } catch (err) {
        return ApiResponse.error(res, 'Invalid or expired token', 400, 'Error8');
    }

    // Extract email and OTP from the token
    const { email, otp } = decodedToken as { email: string, otp: string };

    // Find the user by email and check OTP in one query
    const user = await User.findOne({ email });
    if (!user) {
        return ApiResponse.error(res, 'No user found with this email address', 404, 'Error9');
    }

    // Check if the OTP in the token matches the stored OTP
    if (user.otp !== otp) {
        return ApiResponse.error(res, 'OTP does not match', 400, 'Error10');
    }

    // Validate the new password strength
    const isPasswordValid = validatePasswordStrength(newPassword);
    if (!isPasswordValid) {
        return ApiResponse.error(res, 'Password does not meet the required strength criteria', 400, 'Error11');
    }

    // Use the `setPassword` method to hash the new password before saving
    await user.setPassword(newPassword);

    // Save the updated user object
    const updatedUser = await user.save();
    console.log("Updated user:", updatedUser);

    if (!updatedUser) {
        return ApiResponse.error(res, 'Failed to update password', 500, 'Error12');
    }

    // Send a success response
    return ApiResponse.success(res, updatedUser, 'Password has been reset successfully', 200);
});





// Password strength validation function (already provided)
function validatePasswordStrength(password: string): boolean {
    // Require at least 8 characters, one uppercase, one lowercase, and one number
    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}


