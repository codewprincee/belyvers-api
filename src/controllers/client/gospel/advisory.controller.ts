import { Request, Response } from "express";
import ZoneModel from "../../../models/Zone.model";
import ApiResponse from "../../../utils/ApiResponse";
import asyncHandler from "../../../utils/asyncHandler";
import { CustomRequest } from "../../../middlewares/auth.middleware";


export const createZone = async (req: Request, res: Response) => {
    const { name, description, status, church } = req.body;
    const zone = await ZoneModel.create({ name, description, status, church });
    return ApiResponse.success(res, zone, "Zone created successfully", 201);
}

export const updateZone = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, status, church } = req.body;
}
