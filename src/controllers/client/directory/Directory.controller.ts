import { Request, Response, NextFunction } from "express";
import asyncHandler from "../../../utils/asyncHandler";
import ApiResponse from "../../../utils/ApiResponse";
import Member from "../../../models/Directory.model";
import { error } from "console";
import mongoose from "mongoose";
import { filter } from "compression";
import { log } from "winston";

interface CustomRequest extends Request {
  user: {
    churchID: string;
    _id: string;
  };
  files: any;
}
// @ts-ignore
//@ts-nocheck
//@ts-ignore
export const AddMember = asyncHandler(
  //@ts-ignore
  async (req: CustomRequest, res: Response) => {
    // Destructure member data from request body, including new fields
    const {
      firstName,
      lastName,
      ageGroup,
      email,
      phone,
      city,
      country,
      zipCode,
      state,
      professionalStatus = "",
      academicStatus = "",
      transportationStatus = "",
      profilePicture = null,
      spiritualTraining = "", // New field with default
      salvationPrayer = "", // New field with default
      gender = "",
      churchDiscovery = "", // New field with default
    } = req.body;

    console.log("Form ", spiritualTraining);

    // Get churchId from authenticated user
    const { churchID } = req.user;

    console.log(churchID);

    // List of required fields (including the new field emergencyContactName)
    const requiredFields = [
      firstName,
      lastName,
      ageGroup,
      email,
      phone,
      spiritualTraining,
      city,
      country,
      gender,
      state,
    ];

    // Check if all required fields are provided
    if (requiredFields.some((field) => !field)) {
      return ApiResponse.error(res, "All fields are required", 400);
    }

    // Trim spaces and ensure email is lowercase
    const trimmedData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ageGroup: ageGroup.trim(),

      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      spiritualTraining: spiritualTraining.trim(),
      city: city.trim(),
      country: country.trim(),
      zipCode: zipCode.trim(),
      gender: gender.trim(),
      state: state.trim(),
    };
    console.log("Trimmed Data", trimmedData);


    const {
      firstName: tFirstName,
      lastName: tLastName,
      email: tEmail,
      phone: tPhone,
    } = trimmedData;

    // Generate unique memberID
    const emailPrefix = tEmail.split("@")[0].slice(0, 2).toUpperCase(); // First 2 chars of email
    const phoneSuffix = tPhone.slice(-4); // Last 4 digits of phone
    const randomDigit = Math.floor(Math.random() * 10); // Random digit
    const memberID = `${emailPrefix}${phoneSuffix}${randomDigit}`;

    // Check if memberID already exists
    const existingMember = await Member.findOne({
      memberID,
    });
    if (existingMember) {
      return ApiResponse.error(
        res,
        "Generated Member ID already exists, try again",
        409
      );
    }

    // Check if email already exists
    const existingMemberEmail = await Member.findOne({
      email: tEmail,
    });
    if (existingMemberEmail) {
      return ApiResponse.error(res, "Email ID already exists", 409);
    }

    console.log(spiritualTraining);

    // Create the new member with the new fields
    const newMember = new Member({
      memberID, // Unique memberID
      firstName: tFirstName,
      lastName: tLastName,
      ageGroup,
      email: tEmail,
      phone: trimmedData.phone,

      city: trimmedData.city,
      country: trimmedData.country,
      zipCode: trimmedData.zipCode,
      gender: trimmedData.gender,
      state: trimmedData.state,
      professionalStatus,
      academicStatus,
      transportationStatus,
      profilePicture,
      spiritualTraining: trimmedData.spiritualTraining, // New field
      salvationPrayer, // New field
      churchDiscovery, // New field
      churchId: churchID,
    });

    // Save the new member to the database
    await newMember.save();

    // Return success response with the member's ID
    return ApiResponse.success(
      res,
      {
        memberID,
      },
      "Member added successfully",
      201
    );
  }
);

//@ts-ignore
export const getAllMembers = asyncHandler(
  // @ts-ignore
  async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user;
    console.log("MY SS", churchID);

    const {
      page = 1,
      limit = 10,
      searchTerm,
      departmentFilter,
      roleFilter,
      roleType,
    } = req.query;

    console.log(roleType);

    // Validate the pagination parameters
    const pageNum = parseInt(page as string, 10) || 1; // Default to page 1
    const pageSize = parseInt(limit as string, 10) || 10; // Default to 10 items per page

    const skip = (pageNum - 1) * pageSize;

    // Building query filters based on search parameters
    const filters: any = {};
    if (searchTerm) {
      filters.$text = {
        $search: searchTerm,
      }; // Use text search for name, email, etc.
    }
    if (departmentFilter && departmentFilter !== "All") {
      filters.department = departmentFilter;
    }
    if (roleFilter && roleFilter !== "All") {
      filters.role = roleFilter;
    }

    try {
      // Fetch the total count of matching members
      const totalCount = await Member.countDocuments(filters);

      // Fetch the members with pagination and filters
      const members = await Member.find({
        ...filters,
        churchId: churchID,
        ...(roleType !== "all" && { role: roleType }),
      });

      if (!members || members.length === 0) {
        return ApiResponse.error(res, "No members found", 404);
      }

      // Return success with paginated members and total count
      return ApiResponse.success(
        res,
        {
          members,
          totalCount, // Return the total count of members
        },
        "Members fetched successfully",
        200
      );
    } catch (error) {
      console.error(error);
      return ApiResponse.error(
        res,
        "An error occurred while fetching members",
        500
      );
    }
  }
);

//@ts-ignore
interface SearchFilters {
  $or?: Array<{
    [key: string]: {
      $regex: string;
      $options: string;
    };
  }>;
  role?: string;
  userType?: string;
  churchId: string;
  city?: string;
  department?: string;
  age?: {
    $gte?: number;
    $lte?: number;
  };
  professionalStatus?: string;
  academicStatus?: string;
  spiritualTraining?: string;
  [key: string]: any;
}

// @ts-ignore

export const searchMembers = asyncHandler(
  //@ts-ignore
  async (req: CustomRequest, res: Response) => {
    const { churchID: churchId } = req.user;
    const {
      firstName,
      searchTerm,
      role,
      userType,
      location,
      age,
      department,
      professionalStatus,
      academicStatus,
      spiritualTraining,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.body;

    // Initialize filters object
    const filters: SearchFilters = {
      churchId,
    }; // Add churchId to the filters

    // Search term filter (search by firstName, lastName, and email)
    if (searchTerm) {
      filters.$or = [
        {
          firstName: {
            $regex: searchTerm.trim(),
            $options: "i",
          },
        }, // Case-insensitive match
        {
          lastName: {
            $regex: searchTerm.trim(),
            $options: "i",
          },
        },
        {
          email: {
            $regex: searchTerm.trim(),
            $options: "i",
          },
        },
      ];
    }

    // Basic filters (role, userType, location, department)
    if (role && role !== "All") filters.role = role;
    if (userType && userType !== "All") filters.userType = userType;
    if (location && location !== "All") filters.city = location;
    if (department && department !== "All") filters.department = department;

    // Age filter
    if (age) {
      const ageNum = parseInt(age);
      if (!isNaN(ageNum)) {
        filters.age = {
          $gte: ageNum,
          $lte: ageNum,
        };
      }
    }

    // Additional status filters
    if (professionalStatus && professionalStatus !== "All") {
      filters.professionalStatus = professionalStatus;
    }
    if (academicStatus && academicStatus !== "All") {
      filters.academicStatus = academicStatus;
    }
    if (spiritualTraining && spiritualTraining !== "All") {
      filters.spiritualTraining = spiritualTraining;
    }

    try {
      // Calculate pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Cap at 100 items per page
      const skip = (pageNum - 1) * limitNum;

      // Prepare sort options
      const sortOptions: {
        [key: string]: "asc" | "desc";
      } = {
        [sortBy]: sortOrder,
      };

      // Execute query with pagination and sorting
      const [members, total] = await Promise.all([
        Member.find(filters) // Removed `.where(churchId)`
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .select("-password -refreshToken"), // Exclude sensitive fields
        Member.countDocuments(filters),
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limitNum);

      // Send response
      res.json({
        success: true,
        data: {
          members,
          pagination: {
            total,
            page: pageNum,
            totalPages,
            limit: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
      });
    } catch (error: any) {
      // Log the error for debugging
      console.error("Search members error:", error);

      // Send appropriate error response
      res.status(500).json({
        success: false,
        message: "Error fetching members",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);
// @ts-ignore
//@ts-nocheck
//@ts-ignore

export const getSingleMemberDetail = asyncHandler(
  //@ts-ignore
  async (req: CustomRequest, res: Response) => {
    const { userID } = req.body;

    // Check if userID is provided
    if (!userID) {
      return ApiResponse.error(res, "User ID doesn't exist", 401);
    }

    try {
      // Find member by ID and populate relevant fields
      const data = await Member.findById(userID)
        .populate("leader") // Populating leader field
        .populate("peopleAssigned") // Populating peopleAssigned field
        .populate("reportingLeader"); // Populating reportingLeader field

      if (!data) {
        // If member is not found, return 404 error
        return ApiResponse.error(res, "Member not found", 404);
      }

      // If member is found, return success response
      return ApiResponse.success(
        res,
        {
          data,
        },
        "Member Found",
        200
      );
    } catch ({ error }: any) {
      // Handle server error
      return ApiResponse.error(res, "Server error", 500, error.message);
    }
  }
);

// @ts-ignore
//@ts-nocheck
//@ts-ignore
export const getDirectoryAnalytics = asyncHandler(
  //@ts-ignore
  async (req: CustomRequest, res: Response) => {
    const { churchID: churchId } = req.user;

    console.log("Church Id", churchId);

    // Get the start of today (midnight)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Fetch data for the analytics
    const [
      genderStats,
      ageGroupStats,
      transportationStats,
      professionStats,
      educationStats,
      spiritualTrainingStats,
      salvationPrayerStats,
      churchDiscoveryStats,
      todayRegisteredStats,
    ] = await Promise.all([
      // Gender analytics
      Member.aggregate([
        { $match: { churchId } },
        { $group: { _id: "$gender", count: { $sum: 1 } } },
      ]),
      // Age group analytics
      Member.aggregate([
        { $match: { churchId } },
        { $group: { _id: "$ageGroup", count: { $sum: 1 } } },
      ]),
      // Transportation analytics
      Member.aggregate([
        { $match: { churchId } },
        { $group: { _id: "$transportationStatus", count: { $sum: 1 } } },
      ]),
      // Professional status analytics
      Member.aggregate([
        { $match: { churchId } },
        { $group: { _id: "$professionalStatus", count: { $sum: 1 } } },
      ]),
      // Academic status analytics
      Member.aggregate([
        { $match: { churchId } },
        { $group: { _id: "$academicStatus", count: { $sum: 1 } } },
      ]),
      // Spiritual training analytics (fixed field name here)
      Member.aggregate([
        { $match: { churchId } },
        { $group: { _id: "$spiritualTraining", count: { $sum: 1 } } }, // Changed from $SpiritualTraining to $spiritualTraining
      ]),
      // Salvation prayer analytics
      Member.aggregate([
        { $match: { churchId } },
        { $group: { _id: "$salvationPrayer", count: { $sum: 1 } } },
      ]),
      // Church discovery analytics
      Member.aggregate([
        { $match: { churchId } },
        { $group: { _id: "$churchDiscovery", count: { $sum: 1 } } },
      ]),
      // Role analytics (to count Leader, Pastor, Servant)
      Member.aggregate([
        { $match: { churchId } },
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
      // Total members registered today
      Member.aggregate([
        {
          $match: {
            churchId,
            createdAt: { $gte: startOfDay },
          },
        },
        { $count: "totalRegisteredToday" },
      ]),
    ]);

    // Count members with specific roles
    const leaderCount = await Member.countDocuments({ churchId, role: 'Leader' });
    const pastorCount = await Member.countDocuments({ churchId, role: 'Pastor' });
    const memberCount = await Member.countDocuments({ churchId, role: 'member' }); // Updated role for Head Pastor
    const servantCount = await Member.countDocuments({ churchId, role: 'Servant' });

    console.log('Leader Count:', leaderCount);
    console.log('Pastor Count:', pastorCount);
    console.log('Head Pastor Count:', memberCount); // Log the head pastor count
    console.log('Servant Count:', servantCount);

    // Helper function to format the results
    const formatAnalytics = (data: any[]) => {
      return data.map((item) => ({
        name: item._id || "Unknown", // Ensure we return a label even if _id is null or undefined
        value: item.count || 0, // Ensure the count is a valid number
      }));
    };

    // Get the total registered today count (fallback to 0 if no data found)
    const totalRegisteredToday = todayRegisteredStats[0]?.totalRegisteredToday || 0;

    // Return the response with the formatted analytics data
    return ApiResponse.success(res, {
      gender: formatAnalytics(genderStats),
      ageGroups: formatAnalytics(ageGroupStats),
      transportation: formatAnalytics(transportationStats),
      professionalStatus: formatAnalytics(professionStats),
      educationStatus: formatAnalytics(educationStats),
      spiritualTraining: formatAnalytics(spiritualTrainingStats),
      salvationPrayer: formatAnalytics(salvationPrayerStats),
      churchDiscovery: formatAnalytics(churchDiscoveryStats),
      memberData: {
        leaderCount,
        pastorCount,
        memberCount, // Include the head pastor count
        servantCount,
      },
      totalRegisteredToday, // Add this in the response
      message: "Found Successfully",
      statusCode: 200,
    });
  }
);



//@ts-ignore
export const updateToServant = asyncHandler(
  //@ts-ignore
  async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user;
    const {
      memberId,
      emergencyContactName,
      emergencyPhone,
      departmentAssigned,
      selectedLeader,
      homeAddress,
      dob,
    } = req.body;

    // Validate memberId
    if (!memberId) {
      return res.status(400).json({ message: "Member ID is required" });
    }

    // Find the member by ID
    const member = await Member.findOne({
      _id: memberId,
      churchId: churchID,
    });

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Update emergency contact fields if provided
    if (emergencyContactName)
      member.emergencyContactName = emergencyContactName;
    if (emergencyPhone) member.emergencyPhone = emergencyPhone;

    // Update departmentAssigned if provided
    if (departmentAssigned && Array.isArray(departmentAssigned)) {
      member.departmentAssigned = departmentAssigned.map((dept) => ({
        title: dept.title || "", // Default to empty if title is missing
        value: dept.value || "", // Default to empty if value is missing
      }));
    }

    // Handle the selectedLeader field: Convert leader IDs to ObjectId
    if (selectedLeader && Array.isArray(selectedLeader)) {
      // Validate each leader ID's 'value' and convert to ObjectId if valid
      member.leader = selectedLeader.map((leader) => {
        const leaderId = leader.value; // Access the 'value' field
        if (!mongoose.Types.ObjectId.isValid(leaderId)) {
          throw new Error(`Invalid leader ID: ${leaderId}`);
        }
        return new mongoose.Types.ObjectId(leaderId); // Convert to ObjectId
      });
    }

    // Update other fields (homeAddress, dob)
    if (homeAddress) member.homeAddress = homeAddress;
    if (dob) member.dob = dob;
    member.role = "Servant";

    // Save the updated member data to the database
    await member.save();

    // Return the success response
    return res
      .status(200)
      .json({ message: "Member updated successfully", member });
  }
);

export const updateToLeader = asyncHandler(
  // @ts-ignore
  async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user || {}; // Ensure churchID is available from req.user
    const {
      memberId,
      selectedReportingLeader,
      selectedPeople,
      departmentAssigned,
    } = req.body;

    // Validate input fields
    if (!memberId) {
      res.status(400).json({ message: "Member ID is required" });
      return;
    }

    try {
      console.log("Updating member with ID:", memberId);

      const memberIdObjectId = new mongoose.Types.ObjectId(memberId);
      const churchIdObjectId = churchID
        ? new mongoose.Types.ObjectId(churchID)
        : null;

      // Find the member by ID
      const member = await Member.findOne({
        _id: memberIdObjectId,
      });

      if (!member) {
        res.status(404).json({ message: "Member not found" });
        return;
      }

      // Update role to Leader
      member.role = "Leader";

      // Update departmentAssigned: Add title and value to the array if provided
      if (departmentAssigned && Array.isArray(departmentAssigned)) {
        member.departmentAssigned = departmentAssigned.map(
          (dept: { title: string; value: string }) => ({
            title: dept.title || "", // Default to empty if title is missing
            value: dept.value || "", // Default to empty if value is missing
          })
        );
      }

      // Update selectedPeople (peopleAssigned)

      if (selectedPeople && Array.isArray(selectedPeople)) {
        console.log(selectedPeople);

        // Validate each leader ID's 'value' and convert to ObjectId if valid
        member.peopleAssigned = selectedPeople.map((leader) => {
          const leaderId = leader.value; // Access the 'value' field
          if (!mongoose.Types.ObjectId.isValid(leaderId)) {
            throw new Error(`Invalid leader ID: ${leaderId}`);
          }
          return new mongoose.Types.ObjectId(leaderId); // Convert to ObjectId
        });
      }

      // Update selectedReportingLeader

      if (selectedReportingLeader && Array.isArray(selectedReportingLeader)) {
        // Validate each leader ID's 'value' and convert to ObjectId if valid
        member.reportingLeader = selectedReportingLeader.map((leader) => {
          const leaderId = leader.value; // Access the 'value' field
          if (!leaderId || !mongoose.Types.ObjectId.isValid(leaderId)) {
            throw new Error(`Invalid leader ID: ${leaderId}`);
          }
          return new mongoose.Types.ObjectId(leaderId); // Convert to ObjectId
        });
      }

      // Save the updated member
      await member.save();

      res.status(200).json({ message: "Member updated successfully", member });
    } catch (error: any) {
      console.error("Error updating member:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);
export const updateToPastor = asyncHandler(
  // @ts-ignore
  async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user || {}; // Ensure churchID is available from req.user
    const {
      memberId,
      selectedReportingLeader,
      selectedLeader,
      church,
      departmentAssigned,
    } = req.body;

    // Validate input fields
    if (!memberId) {
      res.status(400).json({ message: "Member ID is required" });
      return;
    }

    try {
      console.log("Updating member with ID:", memberId);

      const memberIdObjectId = new mongoose.Types.ObjectId(memberId);
      const churchIdObjectId = churchID
        ? new mongoose.Types.ObjectId(churchID)
        : null;

      // Find the member by ID
      const member = await Member.findOne({
        _id: memberIdObjectId,
      });

      if (!member) {
        res.status(404).json({ message: "Member not found" });
        return;
      }

      // Validate and update church field
      // Check if `church` exists and is an object with a `value` field
      if (
        church &&
        typeof church === "object" &&
        church.hasOwnProperty("value") &&
        church.value
      ) {
        console.log("Church Data:", church.value);
        member.church = church.value; // Assign `church.value` to `member.church`
      } else {
        console.warn("Invalid or missing church data in request body.");
        member.church = ""; // Set `member.church` to `null` if invalid or missing
      }

      // Update role to Leader
      member.role = "Pastor";

      // Update departmentAssigned: Add title and value to the array if provided
      if (departmentAssigned && Array.isArray(departmentAssigned)) {
        member.departmentAssigned = departmentAssigned.map(
          (dept: { title: string; value: string }) => ({
            title: dept.title || "", // Default to empty if title is missing
            value: dept.value || "", // Default to empty if value is missing
          })
        );
      }

      // Update selectedPeople (peopleAssigned)
      if (selectedLeader && Array.isArray(selectedLeader)) {
        console.log(selectedLeader);

        // Validate each leader ID's 'value' and convert to ObjectId if valid
        member.peopleAssigned = selectedLeader.map((leader) => {
          const leaderId = leader.value; // Access the 'value' field
          if (!mongoose.Types.ObjectId.isValid(leaderId)) {
            throw new Error(`Invalid leader ID: ${leaderId}`);
          }
          return new mongoose.Types.ObjectId(leaderId); // Convert to ObjectId
        });
      }

      // Update selectedReportingLeader
      if (selectedReportingLeader && Array.isArray(selectedReportingLeader)) {
        // Validate each leader ID's 'value' and convert to ObjectId if valid
        member.reportingLeader = selectedReportingLeader.map((leader) => {
          const leaderId = leader.value; // Access the 'value' field
          if (!leaderId || !mongoose.Types.ObjectId.isValid(leaderId)) {
            throw new Error(`Invalid leader ID: ${leaderId}`);
          }
          return new mongoose.Types.ObjectId(leaderId); // Convert to ObjectId
        });
      }

      // Save the updated member
      await member.save();

      res.status(200).json({ message: "Member updated successfully", member });
    } catch (error: any) {
      console.error("Error updating member:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

export const getAllLeaders = asyncHandler(
  //@ts-ignore

  async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user;

    const leaders = await Member.find({
      churchId: churchID,
      role: { $in: ["leader", "Leader"] }, // Case-insensitive role check
    });

    if (leaders.length === 0) {
      return ApiResponse.error(res, "No Leader found", 404, error);
    }
    return ApiResponse.success(res, leaders, "Founds leader", 201);
  }
);

// @ts-ignore
export const updateMemberRole = asyncHandler(
  //@ts-ignoreW
  async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user; // Extract churchID from user (assumes middleware sets this)
    const { role, selectedMembers,isUpgraderToGospel } = req.body;

    console.log("User D", role, selectedMembers);

    // Validate input
    if (!role || !selectedMembers || !Array.isArray(selectedMembers)) {
      return ApiResponse.error(
        res,
        "Invalid data. Role and selected members are required.",
        400
      );
    }

    // Update members with the new role
    const updatedMembers = await Member.updateMany(
      {
        _id: { $in: selectedMembers }, // Match members by IDs
        churchId: churchID, // Ensure they belong to the correct church
        
      },
      { $set: { role } } // Update their role
    );

    // Return success response
    return ApiResponse.success(
      res,
      updatedMembers,
      `${updatedMembers.modifiedCount} members updated successfully.`,
      200
    );
  }
);
//@ts-ignore
export const getAllRole = asyncHandler(
  //@ts-ignore
  async (req: CustomRequest, res: Response) => {
    try {
      // Fetch members with specific roles
      const rolesToFetch = ["Servant", "Leader", "Pastor", "Member"];
      const members = await Member.find({ role: { $in: rolesToFetch } });

      // Return the result
      return res.status(200).json({
        success: true,
        data: members,
        message: "Fetched members with specified roles successfully.",
      });
    } catch ({ error }: any) {
      console.error("Error fetching roles:", error);

      // Handle errors
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching roles.",
        error: error.message,
      });
    }
  }
);

export const getMemberByRole = asyncHandler(
  //@ts-ignore

  async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user;

    const { role } = req.params;

    const leaders = await Member.find({
      churchId: churchID,
      role: { $in: [capitalizeFirstLetter(role)] }, // Case-insensitive role check
    });

    if (leaders.length === 0) {
      return ApiResponse.error(res, `No ${role} found`, 404, error);
    }
    return ApiResponse.success(res, leaders, `Founds ${role}`, 201);
  }
);

export const searchMember = asyncHandler(
  //@ts-ignore
  async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user;
    const {
      firstName,
      lastName,
      
    } = req.query; // Changed from req.body to req.query

    try {
      // Build search criteria object
      const searchCriteria: any = { churchId: churchID };

      // Add optional search fields if they exist (with type casting for query params)
      if (firstName) {
        searchCriteria.firstName = { $regex: new RegExp(String(firstName), 'i') };
      }
      if (lastName) {
        searchCriteria.lastName = { $regex: new RegExp(String(lastName), 'i') };
      }
     
      

      // Search for members with populated references
      const members = await Member.find(searchCriteria)
        .populate('leader')
        .populate('peopleAssigned')
        .populate('reportingLeader');

      if (!members || members.length === 0) {
        return ApiResponse.error(res, "No members found matching the criteria", 404);
      }

      return ApiResponse.success(
        res,
        { 
          members,
          count: members.length 
        },
        "Members found successfully",
        200
      );
    } catch (error: any) {
      console.error("Search member error:", error);
      return ApiResponse.error(
        res,
        "Error searching for members",
        500,
        error.message
      );
    }
  }
);

// Add this helper function somewhere in your file
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}