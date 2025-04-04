import asyncHandler from "../../../../utils/asyncHandler";
import { Response, NextFunction } from 'express';
import { CustomRequest } from "../../../../middlewares/auth.middleware";
import Church from "../../../../models/Church.model";
import crypto from 'crypto';

export const setupOnboarding = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { churchName, locations } = req.body;

    if (!churchName || !locations) {
        return res.status(400).json({
            message: 'Church name and location are required',
        });
    }

    const { _id: adminId } = req.user;
    const generatedInviteCode = generateInviteCode(adminId, churchName);

    const church = new Church({
        churchName,
        locations,
        userId: adminId,
        inviteCode: generatedInviteCode,
    });

    await church.save();

    // update the ChurchID of the user
    const user = req.user;
    user.churchID = church._id;

    await user.save();


    return res.status(200).json({
        message: 'Onboarding setup successfully',
    });
});

function generateInviteCode(userId: string, name: string): string {
    return crypto.createHash('sha256')
        .update(userId + name)
        .digest('hex')
        .slice(0, 6)
        .toUpperCase();
}
