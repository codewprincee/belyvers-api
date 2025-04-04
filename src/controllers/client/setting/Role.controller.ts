import { Roles } from "../../../constant";
import UserModel from "../../../models/User.model";
import ApiResponse from "../../../utils/ApiResponse";
import asyncHandler from "../../../utils/asyncHandler";
import { Request, Response } from "express";
import { Role } from "../../../constant"; // Import the Role type
import { CustomRequest } from "../../../middlewares/auth.middleware";
import Department from "../../../routes/v1/directory/Department.model";
import { error } from "console";

const addTeamMember = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { name, email, password, role } = req.body;

    console.log("ROle", role);

    const { churchID } = req.user;

    // Validate that at least one role is provided
    if (!role || role.length === 0) {
      return ApiResponse.error(res, "At least one role is required", 400);
    }

    // Ensure roles are valid by checking against the Roles constant
    const invalidRoles = role.filter(
      (role: Role) => !Object.values(Roles).includes(role)
    );
    if (invalidRoles.length > 0) {
      return ApiResponse.error(
        res,
        `Invalid role(s) provided: ${invalidRoles.join(", ")}`,
        400
      );
    }

    try {
      // Create a new user (team member) and assign roles
      const newUser = new UserModel({
        name,
        email,
        password,
        churchID,
        role, // Assign the roles passed from the request
        features: [], // You can add features here if needed
        refreshToken: "",
        refreshTokenExpiry: new Date(),
      });

      // Save the new user to the database
      await newUser.save();

      return ApiResponse.success(
        res,
        [],
        "Team member added successfully",
        201
      );
    } catch (error) {
      return ApiResponse.error(res, "Error adding team member", 500);
    }
  }
);
const addDepartments = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { title, description } = req.body;
    const { churchID } = req.user;
    // Validate required fields
    if (!title || !description) {
      res.status(400);
      throw new Error("Title and description are required");
    }

    // Create a new department
    const department = new Department({
      title,
      description,
      churchID: churchID || null,
    });

    // Save the department to the database
    const createdDepartment = await department.save();

    // Send response
    res.status(201).json({
      message: "Department created successfully",
      department: createdDepartment,
    });
  }
);

const getAllTeamMember = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { churchID } = req.user; // Extract churchID from URL parameters

    // Validate churchID (optional)
    if (!churchID) {
      return res.status(400).json({
        success: false,
        message: "Church ID is required.",
      });
    }

    // Fetch all team members for the given churchID
    const teamMembers = await UserModel.find({ churchID: churchID }).select('-password -refreshTokenExpiry -refreshToken');

    console.log(teamMembers);
    

    // Check if there are any members for the given churchID
    if (teamMembers.length === 0) {
      return ApiResponse.error(
        res,
        "Team member added successfully",
        201,
        error
      );
    }
  

    // Send response with the list of team members
    return ApiResponse.success(res, teamMembers, "Fetched all team-members", 201);
  }
);
export { addTeamMember, addDepartments,getAllTeamMember };
