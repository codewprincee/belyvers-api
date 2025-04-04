import { CustomRequest } from "../../../middlewares/auth.middleware";
import ZonesModel from "../../../models/Zones.model";
import ApiResponse from "../../../utils/ApiResponse";
import asyncHandler from "../../../utils/asyncHandler";
import DataEntry from "../../../models/gospel/DataEntry.model";
import mongoose from "mongoose";
import Zone from "../../../models/Zone.model";
import CityZoneModel from "../../../models/CityZone.model";
import { addCitytoZone } from "./field.controller";
import Member from "../../../models/Directory.model";
import CityZone from "../../../models/CityZone.model";

interface Zone {
    ZoneName: string;
    ZoneDescription: string;
}



// @ts-ignore
export const CreateZone = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { ZoneName, ZoneDescription } = req.body;
    const { churchID } = req.user;
    const zone = await ZonesModel.create({ ZoneName, ZoneDescription, churchId: churchID });

    if (!zone) {
        return ApiResponse.error(res, "Zone not created", 400);
    }

    return ApiResponse.success(res, zone, "Zone created successfully", 201);

})

// @ts-ignore
export const GetAllZones = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user;
    const zones = await ZonesModel.find({ churchId: churchID });

    return ApiResponse.success(res, zones, "Zones fetched successfully", 200);
})

// @ts-ignore
export const getMetricsDashboard = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user;

    try {
        // First get all zones for this church
        const zones = await Zone.aggregate([
            {
                $match: {
                    church: new mongoose.Types.ObjectId(churchID)
                }
            },
            {
                $lookup: {
                    from: "dataentries",  // collection name for DataEntry model
                    let: { zoneId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$zone", "$$zoneId"] },
                                        { $eq: ["$churchId", new mongoose.Types.ObjectId(churchID)] }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalPeopleEvangelized: { $sum: { $ifNull: ["$peopleEvangelized", 0] } },
                                totalNewConvertsMale: { $sum: { $ifNull: ["$newConvertsMale", 0] } },
                                totalNewConvertsFemale: { $sum: { $ifNull: ["$newConvertsFemale", 0] } },
                                totalPeopleInvited: { $sum: { $ifNull: ["$PeopleInvite", 0] } }
                            }
                        }
                    ],
                    as: "metrics"
                }
            },
            {
                $addFields: {
                    metrics: {
                        $cond: {
                            if: { $eq: [{ $size: "$metrics" }, 0] },
                            then: [{
                                totalPeopleEvangelized: 0,
                                totalNewConvertsMale: 0,
                                totalNewConvertsFemale: 0,
                                totalPeopleInvited: 0
                            }],
                            else: "$metrics"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    status: 1,
                    totalPeopleEvangelized: { $arrayElemAt: ["$metrics.totalPeopleEvangelized", 0] },
                    totalNewConvertsMale: { $arrayElemAt: ["$metrics.totalNewConvertsMale", 0] },
                    totalNewConvertsFemale: { $arrayElemAt: ["$metrics.totalNewConvertsFemale", 0] },
                    totalPeopleInvited: { $arrayElemAt: ["$metrics.totalPeopleInvited", 0] },
                    totalNewConverts: {
                        $add: [
                            { $arrayElemAt: ["$metrics.totalNewConvertsMale", 0] },
                            { $arrayElemAt: ["$metrics.totalNewConvertsFemale", 0] }
                        ]
                    }
                }
            },
            {
                $sort: { name: 1 }
            }
        ]);

        return ApiResponse.success(res, zones, "Zones with metrics fetched successfully", 200);
    } catch (error) {
        console.error('Error in getMetricsDashboard:', error);
        return ApiResponse.error(res, "Error fetching metrics", 500);
    }
});

// @ts-ignore
export const addLeader = asyncHandler(async (req: CustomRequest, res: Response) => {
    try {
        const { churchID } = req.user;
        const { role, selectedMembers, zoneName } = req.body;

        // Input validation
        if (!role || !selectedMembers || !Array.isArray(selectedMembers) || !zoneName) {
            return ApiResponse.error(
                res,
                "Invalid data. Role, zone name, and selected members are required.",
                400
            );
        }

        // Validate role
        if (!["Leader", "Servant"].includes(role)) {
            return ApiResponse.error(
                res,
                "Invalid role. Role must be either 'Leader' or 'Servant'",
                400
            );
        }

        // Update members with the new role and zone assignment
        const updatedMembers = await Member.updateMany(
            {
                _id: { $in: selectedMembers },
                churchId: churchID
            },
            {
                $set: {
                    role: role === "Leader" ? "Leader" : "Servant",
                    isUpgradeToGospel: true,
                    isZoneAssigned: true,
                    zoneAssigned: zoneName
                }
            }
        );

        // Fetch the updated members to return in response
        const updatedMemberDetails = await Member.find({
            _id: { $in: selectedMembers }
        }).select('firstName lastName email phoneNumber role zoneAssigned');

        if (updatedMembers.modifiedCount === 0) {
            return ApiResponse.error(
                res,
                "No members were updated. Please check the provided information.",
                400
            );
        }

        return ApiResponse.success(
            res,
            {
                modifiedCount: updatedMembers.modifiedCount,
                updatedMembers: updatedMemberDetails
            },
            `Successfully updated ${updatedMembers.modifiedCount} members`,
            200
        );
    } catch (error) {
        console.error('Error in addLeader:', error);
        return ApiResponse.error(
            res,
            "Error updating members. Please try again.",
            500
        );
    }
});

// @ts-ignore
export const fetchLeader = asyncHandler(async (req: CustomRequest, res: Response) => {
    try {
        const { churchID } = req.user;
        
        // Find all gospel leaders and servants in the church that are assigned to zones
        const leaders = await Member.find({
            churchId: churchID,
            isUpgradeToGospel: true,
            isZoneAssigned: true,
            role: { $in: ["Leader"] } // Include both Leaders and Servants
        }).select('firstName lastName email phone role zoneAssigned')

        if (!leaders.length) {
            return ApiResponse.success(res, [], "No leaders found", 200);
        }

        return ApiResponse.success(res, leaders, "Leaders fetched successfully", 200);
    } catch (error) {
        console.error('Error in fetchLeader:', error);
        return ApiResponse.error(res, "Error fetching leaders", 500);
    }
});


// @ts-ignore
export const addTeamGospel = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user;
    const { role, uid, zoneName } = req.body;

    console.log("role",role);
    console.log("uid",uid);
    console.log("zoneName",zoneName);

    // Input validation
    if (!role || !uid || !zoneName) {
        return ApiResponse.error(res, "Role, user ID, and zone name are required", 400);
    }

    // Validate role

    const member = await Member.findOne({ _id: uid, churchId: churchID });
    
    if (!member) {
        return ApiResponse.error(res, "Member not found", 404);
    }

    const upgradeToGospel = await Member.findOneAndUpdate(
        { _id: uid, churchId: churchID },
        { $set: { isUpgradeToGospel: true, isZoneAssigned: true, zoneAssigned: zoneName, role } },
        { new: true }
    ).select('firstName lastName email phone role zoneAssigned');

    if (!upgradeToGospel) {
        return ApiResponse.error(res, "Failed to upgrade to gospel", 500);
    }
    
    return ApiResponse.success(res, upgradeToGospel, "Member upgraded to gospel successfully", 201);
});


// @ts-ignore
export const fetchTeamGospel = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user;

    const teamGospel = await Member.find({ churchId: churchID, isUpgradeToGospel: true, isZoneAssigned: true });

    return ApiResponse.success(res, teamGospel, "Team gospel fetched successfully", 200);
});

// @ts-ignore
export const viewZoneData = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user;

    // First get all zones with their cities
    const zoneCities = await CityZone.aggregate([
        {
            $match: {
                church: new mongoose.Types.ObjectId(churchID)
            }
        },
        {
            $group: {
                _id: "$zone",
                cities: {
                    $push: {
                        city: "$city",
                        province: "$province",
                        country: "$country"
                    }
                }
            }
        }
    ]);

    // Then get zone members
    const zoneMembers = await Member.aggregate([
        {
            $match: {
                churchId: new mongoose.Types.ObjectId(churchID),
                isUpgradeToGospel: true,
                isZoneAssigned: true,
                zoneAssigned: { $ne: null },
                role: { $in: ["Coordinator", "Leader", "Servant"] }
            }
        },
        {
            $group: {
                _id: "$zoneAssigned",
                members: {
                    $push: {
                        _id: "$_id",
                        firstName: "$firstName",
                        lastName: "$lastName",
                        email: "$email",
                        phone: "$phone",
                        role: "$role"
                    }
                }
            }
        },
        {
            $project: {
                zoneName: "$_id",
                coordinator: {
                    $filter: {
                        input: "$members",
                        as: "member",
                        cond: { $eq: ["$$member.role", "Coordinator"] }
                    }
                },
                leaders: {
                    $filter: {
                        input: "$members",
                        as: "member",
                        cond: { $eq: ["$$member.role", "Leader"] }
                    }
                },
                servants: {
                    $filter: {
                        input: "$members",
                        as: "member",
                        cond: { $eq: ["$$member.role", "Servant"] }
                    }
                }
            }
        }
    ]);

    // Combine zone members with their cities
    const combinedData = zoneMembers.map(zone => {
        const zoneCity = zoneCities.find(zc => zc._id === zone.zoneName);
        return {
            ...zone,
            cities: zoneCity ? zoneCity.cities : []
        };
    });

    return ApiResponse.success(res, combinedData, "Zone members fetched successfully", 200);
});
